import * as config from "stdlib/config"
import * as orm from "stdlib/orm";

function main() {
    let conf = config.load()
    let db = sql.open(conf.database.driver, conf.database.connectionString)
    db.namespace = "attendance"
    runtime.context.db = db.open("tenant_default")
    sql.execRaw("SET FOREIGN_KEY_CHECKS=0")
    sql.execRaw("TRUNCATE tenant_default.attendance_worker")
    sql.execRaw("TRUNCATE tenant_default.attendance_punch")
    sql.execRaw("SET FOREIGN_KEY_CHECKS=1")
    generate(5)
}

export function generate(workers: number) {
    sql.beginTransaction()

    for (let i = 1; i < workers; i++) {
        orm.insert("worker", <Worker>{
            name: "Empleado " + i,
            code: i
        })

        let start = time.now().addDays(-30)
        let end = time.now()
        while (start.before(end)) {
            start = start.addDays(1)

            let punches = math.rand(2)
            for (let j = 0; j <= punches; j++) {

                let t = start.setTime(10, math.rand(60))

                if (math.rand(10) > 2) {
                    orm.insert("punch", <Punch>{
                        workerCode: i,
                        idWorker: i,
                        recordType: math.rand(15),
                        date: t
                    })

                    if (math.rand(10) > 8) {
                        t = t.addMinutes(math.rand(61) + 1)
                        orm.insert("punch", <Punch>{
                            workerCode: i,
                            idWorker: i,
                            recordType: math.rand(15),
                            date: t
                        })
                    }

                    if (math.rand(15) > 1) {
                        t = t.addMinutes(math.rand(60) + 1)
                        orm.insert("punch", <Punch>{
                            workerCode: i,
                            idWorker: i,
                            recordType: 15,
                            date: t
                        })
                    }
                } else {
                    // empieza por la 15
                    orm.insert("punch", <Punch>{
                        workerCode: i,
                        idWorker: i,
                        recordType: 15,
                        date: t
                    })

                    if (math.rand(10) > 8) {
                        t = t.addMinutes(math.rand(60) + 1)
                        orm.insert("punch", <Punch>{
                            workerCode: i,
                            idWorker: i,
                            recordType: math.rand(15),
                            date: t
                        })
                    }

                    if (math.rand(15) > 1) {
                        t = t.addMinutes(math.rand(60) + 1)
                        orm.insert("punch", <Punch>{
                            workerCode: i,
                            idWorker: i,
                            recordType: math.rand(15),
                            date: t
                        })
                    }
                }

            }
        }
    }

    sql.commit()



}


function init() {

    orm.register({
        name: "worker",
        label: "@@Empleado",
        pluralLabel: "@@Empleados",
        permissionFlags: "CRUDI",
        properties: [
            { name: "name", type: "string", size: 150, label: "@@Nombre" },
            { name: "code", type: "int", label: "@@Código", nullable: true },
            { name: "avatar", type: "image", label: "@@Foto", isPublic: true, nullable: true, width: 200, height: 200 },
            { name: "nationalID", type: "string", size: 30, label: "@@DNI", nullable: true },
            { name: "socialSecurityNum", type: "string", size: 50, label: "@@Nº de afiliación", nullable: true },
            { name: "idCenter", type: "lookup", refTable: "center", refDesc: "name", label: "@@Centro", nullable: true },
            { name: "idCalendar", type: "int", nullable: true, hidden: true },
            { name: "idBaseCalendar", type: "lookup", refTable: "calendar", refDesc: "name", label: "@@Calendario base", nullable: true },
            { name: "email", type: "string", size: 60, label: "@@Email", nullable: true },
            { name: "phone", type: "string", size: 30, label: "@@Teléfono", nullable: true },
            { name: "password", type: "hash", label: "@@Contraseña", nullable: true },
            { name: "pin", type: "string", size: 10, label: "@@Pin", nullable: true },
            { name: "card", type: "string", size: 50, label: "@@Tarjeta", nullable: true },
            { name: "comments", type: "text", label: "@@Observaciones", nullable: true },
        ],
        constraints: [
            { type: "unique", columns: ["idInTerminals"] },
            { type: "unique", columns: ["email"] },
            { type: "unique", columns: ["nationalID"] }
        ]
    })




    orm.register({
        name: "punch",
        label: "@@Fichaje",
        pluralLabel: "@@Fichajes",
        permissionFlags: "CRUDI",
        properties: [
            {
                name: "idWorker", type: "lookup", refTable: "worker",
                refDesc: "name", label: "@@Empleado", foreignKey: false
            },
            { name: "workerCode", type: "int", label: "@@Código de trabajador", nullableInType: true },
            { name: "date", type: "datetime", label: "@@Fecha", nullableInType: true },
            {
                name: "type", type: "picklist", label: "@@Tipo", nullableInType: true, items: [
                    { value: 0, name: "start", label: "@@Entrada" },
                    { value: 1, name: "end", label: "@@Salida" },
                ]
            },
            {
                name: "idWorkType", type: "lookup", refTable: "workType", refDesc: "name", foreignKey: false,
                label: "@@Código de Trabajo", nullable: true
            },
            { name: "workType", type: "int", label: "@@Código de trabajo", nullable: true },
            { name: "recordType", type: "int", label: "@@Estado", nullable: true },
            {
                name: "method", type: "picklist", label: "@@Método", readOnly: true, nullableInType: true, items: [,
                    { value: 0, name: "manual", label: "@@Manual" },
                    { value: 1, name: "web", label: "@@Web" },
                    { value: 2, name: "fingerprint", label: "@@Huella" },
                    { value: 3, name: "card", label: "@@Tarjeta" },
                    { value: 4, name: "pin", label: "@@PIN" }
                ]
            },
            {
                name: "idTerminal", type: "lookup", refTable: "terminal", refDesc: "name", foreignKey: false,
                readOnly: true, nullable: true, label: "@@Terminal"
            },
            // { name: "isBreak", type: "bool", label: "@@Pausa", nullableInType: true },

            {
                name: "incidence", type: "picklist", label: "@@Incidencia", readOnly: true, nullableInType: true, items: [
                    { value: 0, name: "none", label: "@@Correcto" },
                    { value: 1, name: "noEnd", label: "@@Falta la salida" },
                    { value: 2, name: "noStart", label: "@@Falta la entrada" },
                    { value: 3, name: "startAfterStart", label: "@@Entrada sin salida previa" },
                    { value: 5, name: "beforePreviousPunch", label: "@@Fecha anterior al último fichaje" }, ,
                    { value: 6, name: "afterNextPunch", label: "@@Fecha posterior al siguiente fichaje" },
                ]
            },

            { name: "data", type: "json", label: "@@Datos", hidden: true, readOnly: true, nullable: true },

            { name: "comments", type: "text", label: "@@Observaciones", nullable: true },

            {
                name: "edits", type: "int", label: "@@Cambios", nullableInType: true, help: "@@Si el empleado ha realizado ediciones",
                readOnly: true, transient: true, sqlExpression: `(SELECT count(*) FROM punchedit pp WHERE pp.idPunch = a.id)`
            },

            { name: "editByWorker", type: "bool", transient: true, hidden: true, nullable: true }
        ]
    })
}

interface Punch {
    id?: number;
    idWorker: number;
    workerName?: string;
    workerCode?: number;
    date?: time.Time;
    type?: PunchType;
    idWorkType?: number;
    workTypeName?: string;
    workType?: number;
    recordType?: number;
    method?: PunchMethod;
    idTerminal?: number;
    terminalName?: string;
    incidence?: PunchIncidence;
    data?: string;
    comments?: string;
    edits?: number;
    editByWorker?: boolean;
    idCreateUser?: number;
    createUserName?: string;
    createDate?: time.Time;
    deleted?: boolean;
}

interface Worker {
    id?: number;
    name: string;
    code?: number;
    avatar?: string;
    nationalID?: string;
    socialSecurityNum?: string;
    idCenter?: number;
    centerName?: string;
    idCalendar?: number;
    idBaseCalendar?: number;
    baseCalendarName?: string;
    email?: string;
    phone?: string;
    password?: string;
    pin?: string;
    card?: string;
    comments?: string;
    idCreateUser?: number;
    createUserName?: string;
    createDate?: time.Time;
    deleted?: boolean;
}

enum PunchType {
    start = 0,
    end = 1,
}

enum PunchMethod {
    manual = 0,
    web = 1,
    fingerprint = 2,
    card = 3,
    pin = 4,
}

enum PunchIncidence {
    none = 0,
    noEnd = 1,
    noStart = 2,
    startAfterStart = 3,
    beforePreviousPunch = 5,
    afterNextPunch = 6,
}

enum PunchEditType {
    create = 1,
    edit = 2,
    delete = 3,
    recover = 4,
}

enum PunchEditModifiedBy {
    worker = 1,
    admin = 2,
}

enum TerminalCommMode {
    server = 1,
    client = 2,
}