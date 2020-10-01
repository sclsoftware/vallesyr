namespace vallesyr {


    S.addRoute("/admin/vallesyr/workerReport", () => {
        let title = T("@@Informe por Empleado")

        let tile = new S.Tile()
        S.create("div", "view_title", tile.element, title)

        let searchRow = S.create("div", "searchRow", tile.element)

        let start = S.getURLDate("start") || S.setDay(new Date(), 1)
        let end = S.getURLDate("end") || S.addDays(S.addMonths(start, 1), -1)

        S.create("span", null, searchRow, "Desde ")
        let startPicker = new S.DatePicker({ date: start })
        searchRow.appendChild(startPicker.element)
        startPicker.addEventListener("input", e => {
            start = e.value
            S.pushURLValue("start", start)
        })

        S.create("span", null, searchRow, " hasta ")
        let endPicker = new S.DatePicker({ date: end })
        searchRow.appendChild(endPicker.element)
        endPicker.addEventListener("input", e => {
            end = e.value
            S.pushURLValue("end", end)
        })

        let selWorker = S.getLookup("idWorker", "attendance.worker", "name", "Empleado")
        selWorker.nullable = true
        searchRow.appendChild(selWorker.element)

        S.createButton("highlighted", searchRow, "Generar", () => generateWorkerReport(start, end, selWorker.selectedValue, panel))

        new S.IconButton("download", "Exportar a Excel", null, searchRow, () => {
            let url = S.getURL("/vallesyr/workerReport.xlsx", {
                start: start,
                end: end,
                idWorker: selWorker.selectedValue,
                cb: new Date().getTime()
            })

            S.downloadUri(url, "report.xlsx")
        })

        let panel = S.create("div", "report", tile.element)
        S.addSpinnerPanel(panel)

        let view = new admin.AdminView("padding vallesyr_report", title)
        view.add(tile)
        S.setView(view)

        generateWorkerReport(start, end, selWorker.selectedValue, panel)
    })

    function generateWorkerReport(start: Date, end: Date, idWorker: number | string, panel: HTMLElement) {
        S.getJson({
            url: "/vallesyr/workerReport.api",
            spinner: false,
            data: {
                start: start,
                end: end,
                idWorker: idWorker
            },
            onSuccess: (data: any) => {
                let table = S.create("table")

                for (let i = 0, l = data.length; i < l; i++) {
                    let item = data[i]
                    let tr = S.create("tr", null, table)
                    for (let j = 0, k = item.length; j < k; j++) {
                        let v = item[j]

                        let cellType = i == 0 ? "th" : "td"

                        let style
                        switch (j) {
                            case 0:
                                style = ""
                                break;

                            case 3:
                                style = "error"
                                break;

                            default:
                                style = "value"
                                break;
                        }

                        S.create(cellType, style, tr, v)
                    }
                }

                S.clear(panel)
                panel.appendChild(table)
            }
        })
    }




















    S.addRoute("/admin/vallesyr/periodReport", () => {
        let title = T("@@Periodo agrupado")

        let tile = new S.Tile()
        S.create("div", "view_title", tile.element, title)

        let searchRow = S.create("div", "searchRow", tile.element)

        let start = S.getURLDate("start") || S.setDay(new Date(), 1)
        let end = S.getURLDate("end") || S.addDays(S.addMonths(start, 1), -1)

        S.create("span", null, searchRow, "Desde ")
        let startPicker = new S.DatePicker({ date: start })
        searchRow.appendChild(startPicker.element)
        startPicker.addEventListener("input", e => {
            start = e.value
            S.pushURLValue("start", start)
        })

        S.create("span", null, searchRow, " hasta ")
        let endPicker = new S.DatePicker({ date: end })
        searchRow.appendChild(endPicker.element)
        endPicker.addEventListener("input", e => {
            end = e.value
            S.pushURLValue("end", end)
        })

        S.createButton("highlighted", searchRow, "Generar", () => generatePeriodReport(start, end, panel))

        new S.IconButton("download", "Exportar a Excel", null, searchRow, () => {
            let url = S.getURL("/vallesyr/periodReport.xlsx", {
                start: start,
                end: end,
                cb: new Date().getTime()
            })

            S.downloadUri(url, "report.xlsx")
        })

        let panel = S.create("div", "report", tile.element)
        S.addSpinnerPanel(panel)

        let view = new admin.AdminView("padding vallesyr_report", title)
        view.add(tile)
        S.setView(view)

        generatePeriodReport(start, end, panel)
    })


    function generatePeriodReport(start: Date, end: Date, panel: HTMLElement) {
        S.getJson({
            url: "/vallesyr/periodReport.api",
            spinner: false,
            data: {
                start: start,
                end: end
            },
            onSuccess: (data: any) => {
                let table = S.create("table")

                for (let i = 0, l = data.length; i < l; i++) {
                    let item = data[i]
                    let tr = S.create("tr", null, table)
                    for (let j = 0, k = item.length; j < k; j++) {
                        let v = item[j]
                        let cellType = i == 0 ? "th" : "td"
                        let style = j == 0 ? "label" : "value"
                        S.create(cellType, style, tr, v)
                    }
                }

                S.clear(panel)
                panel.appendChild(table)
            }
        })
    }


    S.addRoute("/admin/vallesyr/monthReport", () => {
        let title = T("@@Total por mes")

        let tile = new S.Tile()
        S.create("div", "view_title", tile.element, title)

        let searchRow = S.create("div", "searchRow", tile.element)

        let start = S.getURLDate("start") || S.setDay(new Date(), 1)
        let end = S.getURLDate("end") || S.addDays(S.addMonths(start, 1), -1)

        S.create("span", null, searchRow, "Desde ")
        let startPicker = new S.DatePicker({ date: start })
        searchRow.appendChild(startPicker.element)
        startPicker.addEventListener("input", e => {
            start = e.value
            S.pushURLValue("start", start)
        })

        S.create("span", null, searchRow, " hasta ")
        let endPicker = new S.DatePicker({ date: end })
        searchRow.appendChild(endPicker.element)
        endPicker.addEventListener("input", e => {
            end = e.value
            S.pushURLValue("end", end)
        })

        S.createButton("highlighted", searchRow, "Generar", () => generateMonthReport(start, end, panel))

        new S.IconButton("download", "Exportar a Excel", null, searchRow, () => {
            let url = S.getURL("/vallesyr/monthReport.xlsx", {
                start: start,
                end: end,
                cb: new Date().getTime()
            })

            S.downloadUri(url, "report.xlsx")
        })


        let panel = S.create("div", "report", tile.element)
        S.addSpinnerPanel(panel)

        let view = new admin.AdminView("padding vallesyr_report", title)
        view.add(tile)
        S.setView(view)

        generateMonthReport(start, end, panel)
    })


    function generateMonthReport(start: Date, end: Date, panel: HTMLElement) {
        S.getJson({
            url: "/vallesyr/monthReport.api",
            spinner: false,
            data: {
                start: start,
                end: end
            },
            onSuccess: (data: any) => {
                let table = S.create("table")

                for (let i = 0, l = data.length; i < l; i++) {
                    let item = data[i]
                    let tr = S.create("tr", null, table)
                    for (let j = 0, k = item.length; j < k; j++) {
                        let v = item[j]
                        let cellType = i == 0 ? "th" : "td"

                        let style
                        switch (j) {
                            case 0:
                                style = ""
                                break;

                            case k - 1:
                                style = "total leftBorder"
                                break;

                            default:
                                style = "value"
                                break;
                        }

                        S.create(cellType, style, tr, v)
                    }
                }

                S.clear(panel)
                panel.appendChild(table)
            }
        })
    }


}