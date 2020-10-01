import * as orm from "stdlib/orm"

export function syncTerminals() {
    let terminals = sql.query(`SELECT t.id,
                                      t.name,
                                      d.plugin, 
                                FROM attendance:terminal t
                                JOIN attendance:driver d ON d.id = t.idDriver
                                WHERE t.deleted = false
                                ORDER BY t.name`)

    for (let terminal of terminals) {
        syncTerminal(terminal)
    }
}

function syncTerminal(terminal: any) {
    try {
        log.system("%s: Sincronizando hora: %s", terminal.name, time.now().format("15:04"))
        runtime.exec(terminal.plugin + ".setTime", terminal.id)

        log.system("%s: Sincronizando fichajes...", terminal.name)
        runtime.exec("attendance.downloadLogs", true, [terminal.id])

        let idLastUpdate = sql.queryValue(`SELECT idUpdate 
                                           FROM sync 
                                           WHERE idTerminal = ? 
                                           AND deleted = false 
                                           ORDER BY id DESC LIMIT 1`, terminal.id)

        if (!idLastUpdate) {
            idLastUpdate = 0
        }

        let updates = sql.query("SELECT DISTINCT id, idWorker FROM userupdate WHERE id > ?", idLastUpdate) as UserUpdate[]

        if (updates.length > 0) {
            let masterUsers = sql.query(`SELECT id,
                                            deleted,
                                            name,
                                            code AS userCode,
                                            pin AS password,
                                            card,
                                        FROM attendance:worker
                                        WHERE id IN ?`, updates.select(t => t.idWorker))

            let toUpload = masterUsers.where(t => !t.deleted)
            let toDelete = masterUsers.where(t => t.deleted).select(t => t.id)

            log.system("%s: subir %v, borrar %v", terminal.name, toUpload.length, toDelete.length)
            runtime.exec(terminal.plugin + ".syncUsers", terminal.id, toDelete, toUpload)

            orm.insert("sync", <Sync>{
                idTerminal: terminal.id,
                idUpdate: updates.last().id
            })
        }
    } catch (error) {
        fmt.println(error)
        log.system(terminal.name + ": " + error.message)
    }
}


export function getPunchesByEmployee(start: time.Time, end: time.Time, idWorker: number) {
    start = start.startOfDay()
    end = end.endOfDay()

    let q = sql.select(`SELECT w.name,
                                    p.workerCode,
                                    p.date,
                                    p.recordType,
                              FROM attendance:punch p
                              LEFT JOIN attendance:worker w ON w.id = p.idWorker
                              WHERE p.date >= ?
                              AND p.date <= ?
                              AND p.recordType IS NOT NULL
                              AND p.deleted = false
                              AND (w.id IS NULL OR w.deleted = false)
                              ORDER BY w.name, p.date`, start, end)

    if (idWorker) {
        q.and("w.id = ?", idWorker)
    }

    let punches = sql.query(q) as Punch[]

    return getTrips(punches)
}

export function getPunchesByPeriod(start: time.Time, end: time.Time) {
    start = start.startOfDay()
    end = end.endOfDay()

    let punches = sql.query(`SELECT workerCode,
                                 date,
                                 recordType,
                              FROM attendance:punch
                              WHERE date >= ?
                              AND date <= ?
                              AND recordType IS NOT NULL
                              AND deleted = false
                              ORDER BY workerCode, date`, start, end) as Punch[]

    return getTrips(punches)
}

// data points
export const DATAPOINTS = 15
export const HOSPITAL = 15

export function getName(i: number) {
    switch (i) {
        case HOSPITAL:
            return "HOSPITAL"

        default:
            return "Línea " + (i + 1)
    }
}

export function getTrips(punches: Punch[]) {
    let trips: Trip[] = []

    for (let i = 0, l = punches.length; i < l; i++) {
        let p = punches[i]

        if (p.recordType < 0 || p.recordType > HOSPITAL) {
            throw errors.public("Estado inválido: " + p.recordType)
        }

        let trip: Trip = { punches: [p] }

        trips.push(trip)

        // consume the next punches from the trip
        for (let j = i + 1; j < l; j++) {
            let p2 = punches[j]

            if (p2.workerCode != p.workerCode) {
                break
            }

            if (!p2.date.startOfDay().equal(p.date.startOfDay())) {
                break
            }

            // si entra por hospital, la siguiente por el misom es otro viaje
            if (p.recordType == HOSPITAL && p2.recordType == HOSPITAL) {
                break
            }

            i++
            trip.punches.push(p2)

            // si sale por hospital, la siguiente por el misom es otro viaje
            if (p.recordType != HOSPITAL && p2.recordType == HOSPITAL) {
                break
            }
        }

        calculateTrip(trip)
    }

    return trips
}

function calculateTrip(t: Trip) {
    let punches = t.punches
    let ln = punches.length

    if (ln == 1) {
        if (punches[0].recordType == HOSPITAL) {
            t.enters = []
            t.exit = punches[0]
            t.alarm = "Sin entrada"
        } else {
            t.enters = punches.slice(0, 1)
            t.alarm = "Sin salida"
        }
    } else {
        t.enters = []
        for (let i = 0, l = punches.length; i < l; i++) {
            let p = punches[i]
            if (p.recordType == HOSPITAL) {
                t.exit = p
            } else {
                t.enters.push(p)
            }
        }

        let last
        for (let i = 0, l = punches.length; i < l; i++) {
            let p = punches[i]
            if (last) {
                if (p.date.addHours(-1).after(last.date)) {
                    t.alarm = "Más de 60 min entre fichajes"
                } else if (p.date.beforeOrEqual(last.date)) {
                    t.alarm = "Fichaje anterior. ERROR"
                }
            }
            last = p
        }
    }

    t.punches = null
}

export interface Punch {
    name?: string
    workerCode: number
    date: time.Time
    recordType: number
}

export interface Trip {
    punches: Punch[]
    enters?: Punch[]
    exit?: Punch
    alarm?: string
}

