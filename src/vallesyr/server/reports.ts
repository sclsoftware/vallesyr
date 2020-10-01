import * as lib from "lib";

export function periodReport(start: time.Time, end: time.Time) {
    let trips = lib.getPunchesByPeriod(start, end)

    let table = []

    let row: any[] = [
        "Punto de entrada",
        "Entradas",
        "Salidas"
    ]

    table.push(row)

    const DATAPOINTS = 15

    for (let i = 0; i <= DATAPOINTS; i++) {
        table.push([lib.getName(i), 0, 0])
    }

    let totalsRow: any = ["Total", 0, 0]

    for (let trip of trips) {
        for (let enter of trip.enters) {
            let index = enter.recordType == lib.HOSPITAL ? 2 : 1
            let row = table[enter.recordType + 1]
            row[index]++
            totalsRow[index]++
        }

        if (trip.exit) {
            let index = trip.exit.recordType == lib.HOSPITAL ? 2 : 1
            let row = table[trip.exit.recordType + 1]
            row[index]++
            totalsRow[index]++
        }
    }

    table.push(totalsRow)


    return table
}


export function monthReport(start: time.Time, end: time.Time) {
    start = start.startOfDay()
    end = end.endOfDay()

    let data = sql.query(`SELECT DATE(date) as start,
                                    recordType,
                                    count(*) as total,
                              FROM attendance:punch
                              WHERE date >= ?
                              AND date <= ?
                              AND recordType IS NOT NULL
                              AND deleted = false
                              GROUP BY start, recordType`, start, end)

    for (let item of data) {
        let s = item.start
        if (reflect.typeOf(s) == "string") {
            s = time.parse(s)
        }
        item.start = s.startOfDay()
    }

    let rows: any[][] = []

    // header
    let row: any[] = []
    row.push(null)
    rows.push(row)
    let d = start
    while (d.beforeOrEqual(end)) {
        row.push(d.day)
        d = d.addDays(1)
    }
    row.push("Total")
    row.push(null)

    let dayTotals: any = {}

    for (let recordType = 0; recordType <= lib.DATAPOINTS; recordType++) {
        let rowTotal = 0
        row = []
        rows.push(row)
        row.push(lib.getName(recordType))

        let d = start
        while (d.beforeOrEqual(end)) {
            let v = 0

            try {
                for (let j = 0, k = data.length; j < k; j++) {
                    let dayData = data[j]
                    if (dayData.recordType == recordType && dayData.start.equal(d)) {
                        v = dayData.total
                        break
                    }
                }

                row.push(v)
                rowTotal += v

                let unix = d.unix

                if (recordType != lib.HOSPITAL) {
                    dayTotals[unix] += v
                }
            } finally {
                d = d.addDays(1)
            }
        }

        row.push(rowTotal)
    }

    // totals
    row = []
    rows.insertAt(16, row)
    row.push("Total")
    d = start
    while (d.beforeOrEqual(end)) {
        let v = dayTotals[d.unix] || 0
        row.push(v)
        d = d.addDays(1)
    }


    row.push(null)

    return rows
}



export function workerReport(start: time.Time, end: time.Time, idWorker: number) {
    let trips = lib.getPunchesByEmployee(start, end, idWorker)

    let table = []

    let row: any[] = [
        "Empleado",
        "Entradas",
        "Salidas",
        "Alarmas"
    ]


    table.push(row)

    let totalsRow: any = ["Total", 0, 0, ""]

    let lastRow: any[]
    let lastWorkerCode

    for (let trip of trips) {
        let p = trip.enters.length > 0 ? trip.enters[0] : null
        if (!p) {
            p = trip.exit
        }

        if (!lastRow || p.workerCode != lastWorkerCode) {
            lastRow = [
                p.name,
                trip.enters.length,
                trip.exit ? 1 : 0,
                trip.alarm ? formatAlarm(trip) : null
            ]
            table.push(lastRow)
            totalsRow[1] += trip.enters.length;
            totalsRow[2] += trip.exit ? 1 : 0;
            lastWorkerCode = p.workerCode
            continue
        }

        lastRow[1] += trip.enters.length
        lastRow[2] += trip.exit ? 1 : 0

        totalsRow[1] += trip.enters.length;
        totalsRow[2] += trip.exit ? 1 : 0;

        if (trip.alarm) {
            let alarms = lastRow[3]
            if (alarms) {
                lastRow[3] += "\n" + formatAlarm(trip)
            } else {
                lastRow[3] = formatAlarm(trip)
            }
        }
    }

    table.push(totalsRow)

    return table
}


function formatAlarm(trip: lib.Trip) {
    let date
    if (trip.enters.length) {
        date = trip.enters[0].date
    } else {
        date = trip.exit.date
    }
    return fmt.sprintf("Día %s: %s", date.local().format("d"), trip.alarm)
}