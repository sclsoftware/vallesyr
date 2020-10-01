import "stdlib/native"
import * as orm from "stdlib/orm"
import * as system from "stdlib/system"

export function install() {
    orm.createTables()
    system.deleteMenu()

    // system.addMenu({
    //     label: "@@Vallesyr",
    //     url: "/admin/vallesyr/config",
    //     menuName: "settings",
    //     parentName: "system",
    //     priority: 100
    // })


    system.addCustomField({
        entity: "attendance.virtualSettings",
        name: "interval",
        label: "Minutos entre sincronización",
        type: system.FieldType.int,
    })

    system.addCustomField({
        entity: "attendance.virtualSettings",
        name: "syncStart",
        label: "Hora inicio sincronización",
        type: system.FieldType.time,
    })

    system.addCustomField({
        entity: "attendance.virtualSettings",
        name: "syncEnd",
        label: "Hora fin sincronización",
        type: system.FieldType.time,
    })

    system.addMenu({
        label: "@@Totales por mes",
        url: "/admin/vallesyr/monthReport",
        menuName: "main",
        parentName: "reports",
        priority: 2
    })

    system.addMenu({
        label: "@@Totales por periodo",
        url: "/admin/vallesyr/periodReport",
        menuName: "main",
        parentName: "reports",
        priority: 3
    })

    system.addMenu({
        label: "@@Totales por empleado",
        url: "/admin/vallesyr/workerReport",
        menuName: "main",
        parentName: "reports",
        priority: 4
    })

    system.addMenu({
        label: "@@Modificaciones de usuarios",
        url: "/admin/vallesyr/userUpdate",
        menuName: "settings",
        parentName: "system",
        priority: 3
    })
    system.addMenu({
        label: "@@Sincronizaciones",
        url: "/admin/vallesyr/sync",
        menuName: "settings",
        parentName: "system",
        priority: 4
    })
}

export function unInstall() {
    system.deleteMenu()
}