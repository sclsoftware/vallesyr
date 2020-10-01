//meta: permissions trusted
//meta: name Vallesyr
//meta: description Funciones personalizadas para Vallesyr
//meta: depends adminbasicauth attendance license anviz sync customfields
//meta: tenants default lsb demo

import "stdlib/native"
import * as settings from "stdlib/settings"
import * as pluginutil from "lib/pluginutil"
import * as web from "stdlib/web";
import * as lib from "lib";
import * as reports from "reports";
import * as orm from "stdlib/orm"
import * as ormapi from "stdlib/ormapi"
import * as installer from "installer"
import "entities"

const mutext = sync.newMutex()
let syncing = false

function init() {
    let pm = runtime.pluginManager
    if (pm) {
        pm.addHook("attendance.onSave_worker", onSaveWorker)
        pm.addHook("attendance.onDeleting_worker", onDeletingOrRecoveringWorker)
        pm.addHook("attendance.onRecovering_worker", onDeletingOrRecoveringWorker)
    }

    web.addApi({
        url: "/vallesyr/monthReport.api",
        handler: monthReportHandler,
    })

    web.addApi({
        url: "/vallesyr/periodReport.api",
        handler: periodReportHandler,
    })

    web.addApi({
        url: "/vallesyr/workerReport.api",
        handler: workerReportHandler,
    })

    web.addRoute("/vallesyr/monthReport.xlsx", monthReportHandler, web.adminFilter)
    web.addRoute("/vallesyr/periodReport.xlsx", periodReportHandler, web.adminFilter)
    web.addRoute("/vallesyr/workerReport.xlsx", workerReportHandler, web.adminFilter)
}

function onSaveWorker(worker: any) {
    if (!worker.id) {
        return
    }

    orm.insert("userUpdate", <UserUpdate>{
        idWorker: worker.id,
        sync: false
    })
}

function onDeletingOrRecoveringWorker(ids: number[]) {
    for (let id of ids) {
        orm.insert("userUpdate", <UserUpdate>{
            idWorker: id,
            sync: false
        })
    }
}

export function initializePlugin() {
    if (sql.driver == "mysql" && !sql.databases().contains("tenant_default")) {
        log.system("Vallesyr: no default database. Nothing to do...")
        return
    }

    runtime.pluginManager.loadPlugin("attendance")
    runtime.pluginManager.loadPlugin("anviz")
    runtime.pluginManager.loadPlugin("sync")
    runtime.pluginManager.loadPlugin("vallesyr")

    let vm = pluginutil.getVM("default", "vallesyr")
    vm.trusted = false

    let v = vm.context.db.queryValue("SELECT value FROM attendance:settings WHERE name='vallesyr_interval'")

    let d
    if (v == null) {
        log.system("Vallesyr: no hay intervalo de sincronización. No sincronizar nada.")
        return
    } else if (convert.toString(v) == "0") {
        d = 1 * time.Second
        log.system("Vallesyr: iniciando sincronización. Intervalo: contínuo")
    } else {
        d = convert.toInt(v) * time.Minute
        log.system("Vallesyr: iniciando sincronización. Intervalo: %v minutos", v)
        go(() => vm.runFunc("updateTerminals"))
    }

    time.newTicker(d, () => vm.runFunc("updateTerminals"))
}

export function updateTerminals() {
    mutext.lock()
    if (syncing) {
        mutext.unlock()
        return
    }

    log.system("---- init sync ----")
    syncing = true

    defer(() => {
        syncing = false
        log.system("---- fin sync 2----")
        mutext.unlock()
    })

    log.system("\n\n\nSincronizando terminales...")

    // copy the database because we are in a different gorutine each time
    runtime.context.db = runtime.context.db.open(runtime.context.db.database)

    let syncStart = settings.loadValue("attendance.vallesyr_syncstart")
    if (!syncStart) {
        log.system("No hay hora de inicio de sincronización. No sincronizar nada.")
        return
    }

    let syncEnd = settings.loadValue("attendance.vallesyr_syncend")
    if (!syncEnd) {
        log.system("No hay hora de fin de sincronización. No sincronizar nada.")
        return
    }

    let start = time.now().setTimeMillis(syncStart)
    let end = time.now().setTimeMillis(syncEnd)

    let syncHourOK
    if (end.equal(start)) {
        syncHourOK = true
    } else {
        if (end.before(start)) {
            end = end.addDays(1)
        }
        if (time.now().between(start, end)) {
            syncHourOK = true
        }
    }

    if (!syncHourOK) {
        log.system("No hay hora de sincronizar. No sincronizar nada.")
        return
    }

    lib.syncTerminals()
}

function workerReportHandler(c: web.Context) {
    let start = c.request.date("start").startOfDay()
    let end = c.request.date("end").endOfDay()
    let idWorker = c.request.int("idWorker")

    let table = reports.workerReport(start, end, idWorker)

    if (c.request.url.path.hasSuffix(".xlsx")) {
        let headerFunc = (sheet: xlsx.XLSXSheet) => {
            let style = xlsx.newStyle()
            style.font.bold = true
            style.font.size = 17
            style.applyFont = true

            style.alignment.horizontal = "center"
            style.applyAlignment = true

            let row = sheet.addRow()
            row.height = 25
            let cell = row.addCell("VIATGERS SISTEMA T-HOSPITAL")
            cell.merge(33, 0)
            cell.style = style

            sheet.addRow()

            row = sheet.addRow()
            row.addCell("Periodo Inicial:")
            row.addCell(start.format("d")).merge(5, 0)
            row = sheet.addRow()
            row.addCell("Periodo Final:")
            row.addCell(end.format("d")).merge(5, 0)
            row = sheet.addRow()
            row.addCell("Actualización:")
            row.addCell(time.now().format("d")).merge(5, 0)

            sheet.addRow()
        }

        exportToExcel(c, table, headerFunc)
        return
    }

    c.response.writeJSON(table)
}


function periodReportHandler(c: web.Context) {
    let start = c.request.date("start").startOfDay()
    let end = c.request.date("end").endOfDay()

    let table = reports.periodReport(start, end)

    if (c.request.url.path.hasSuffix(".xlsx")) {
        let headerFunc = (sheet: xlsx.XLSXSheet) => {
            let style = xlsx.newStyle()
            style.font.bold = true
            style.font.size = 17
            style.applyFont = true

            style.alignment.horizontal = "center"
            style.applyAlignment = true

            let row = sheet.addRow()
            row.height = 25
            let cell = row.addCell("VIATGERS SISTEMA T-HOSPITAL")
            cell.merge(33, 0)
            cell.style = style

            sheet.addRow()

            row = sheet.addRow()
            row.addCell("Periodo Inicial:")
            row.addCell(start.format("d")).merge(5, 0)
            row = sheet.addRow()
            row.addCell("Periodo Final:")
            row.addCell(end.format("d")).merge(5, 0)
            row = sheet.addRow()
            row.addCell("Actualización:")
            row.addCell(time.now().format("d")).merge(5, 0)

            sheet.addRow()
        }

        exportToExcel(c, table, headerFunc)
        return
    }

    c.response.writeJSON(table)
}




function monthReportHandler(c: web.Context) {
    let start = c.request.date("start").startOfDay()
    let end = c.request.date("end").endOfDay()

    let table = reports.monthReport(start, end)

    if (c.request.url.path.hasSuffix(".xlsx")) {
        let headerFunc = (sheet: xlsx.XLSXSheet) => {
            let style = xlsx.newStyle()
            style.font.bold = true
            style.font.size = 17
            style.applyFont = true

            style.alignment.horizontal = "center"
            style.applyAlignment = true

            let row = sheet.addRow()
            row.height = 25
            let cell = row.addCell("VIATGERS SISTEMA T-HOSPITAL")
            cell.merge(33, 0)
            cell.style = style

            sheet.addRow()

            row = sheet.addRow()
            row.addCell("Periodo Inicial:")
            row.addCell(start.format("d")).merge(5, 0)
            row = sheet.addRow()
            row.addCell("Periodo Final:")
            row.addCell(end.format("d")).merge(5, 0)
            row = sheet.addRow()
            row.addCell("Actualización:")
            row.addCell(time.now().format("d")).merge(5, 0)

            sheet.addRow()
        }

        exportToExcel(c, table, headerFunc)
        return
    }

    c.response.writeJSON(table)
}




type ExcelFunc = (sheet: xlsx.XLSXSheet) => void

function exportToExcel(c: web.Context, table: any[][], headerFunc?: ExcelFunc) {
    let f = xlsx.newFile()
    let sheet = f.addSheet("Informe")

    if (headerFunc) {
        headerFunc(sheet)
    }

    let tr = table[0]
    for (let i = 1, l = tr.length - 1; i < l; i++) {
        sheet.col(i).width = 3
    }

    let headerStyle = xlsx.newStyle()
    headerStyle.font.bold = true
    headerStyle.applyFont = true
    headerStyle.font.size = 9

    for (let i = 0, l = table.length; i < l; i++) {
        let r = table[i]

        let newLines = 0

        let row = sheet.addRow()

        for (let v of r) {
            if (v == null) {
                v = ""
            }

            let cell = row.addCell(v)
            if (i == 0) {
                cell.style = headerStyle
            }

            // to adjust height if it has linebreaks
            if (reflect.typeOf(v) == "string") {
                for (let i = 0, l = v.length; i < l; i++) {
                    if (v[i] == 10) {
                        newLines++
                    }
                }
            }
        }
        if (newLines) {
            row.height = newLines * 14
        }
    }


    let r = c.response;
    r.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    f.write(r)
}

export function serveHTTP(c: web.Context) {
    web.serveHTTP(c)
}

export function install() {
    installer.install()
}

export function unInstall() {
    installer.unInstall()
}

export function getEntity(name: string) {
    return orm.getEntity(name);
}

export function getEntities() {
    return orm.getEntities();
}

export function getEntitiesWithCustomFields() {
    return orm.getEntitiesWithCustomFields();
}

export function getEntityWithCustomFields(name: string) {
    return orm.getEntityWithCustomFields(name);
}

export function getSortedEntities() {
    return orm.getSortedEntities()
}

export function entityCount() {
    return orm.entityCount()
}

export function saveEntity(name: string, model: any) {
    return orm.save(name, model)
}

export function insertEntity(name: string, model: any) {
    return orm.insert(name, model)
}

export function deleteByIDs(entity: string, ids: number[]) {
    return orm.deleteByIDs(entity, ids)
}

export function addForeignKeys() {
    orm.addForeignKeys();
}


export function saveImport(args: ormapi.ImportArgs) {
    return ormapi.saveImport(args)
}

export function saveCustomField(f: ormapi.CustomField) {
    ormapi.saveCustomField(f)
}

export function recoverCustomField(id: number) {
    ormapi.recoverCustomField(id)
}

export function deleteCustomField(id: number) {
    ormapi.deleteCustomField(id)
}

export function updateCustomField(entityName: string, property: string, ids: number[], value: any) {
    ormapi.updateCustomField(entityName, property, ids, value)
}









