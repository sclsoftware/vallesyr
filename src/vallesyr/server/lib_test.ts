// import "stdlib/native"
// import * as lib from "lib"
// import * as orm from "stdlib/orm";
// import * as test from "stdlib/test";
// import * as reports from "reports";


// function testTrips1() {
//     let d = time.date(2019, 11, 25, 10)

//     let punches: lib.Punch[] = [
//         { workerCode: 1, date: d, recordType: 15 },
//         { workerCode: 1, date: d.addMinutes(10), recordType: 10 },
//         { workerCode: 1, date: d.addMinutes(60), recordType: 3 },
//     ]

//     let trips = lib.getTrips(punches)

//     test.assertEqual(1, trips.length)

//     let t1 = trips[0]
//     test.assertEqual(3, t1.punches.length)
//     test.assertEqual(2, t1.enters.length)
//     test.assertEqual(3, t1.exit.recordType)
//     test.assertNull(t1.alarm)
// }

// function testTripsMaxBetweenPunches() {
//     let d = time.date(2019, 11, 25, 10)

//     let punches: lib.Punch[] = [
//         { workerCode: 1, date: d, recordType: 15 },
//         { workerCode: 1, date: d.addMinutes(10), recordType: 10 },
//         { workerCode: 1, date: d.addMinutes(71), recordType: 3 },
//     ]

//     let trips = lib.getTrips(punches)

//     test.assertEqual(1, trips.length)

//     let t1 = trips[0]
//     test.assertEqual(3, t1.punches.length)
//     test.assertEqual(2, t1.enters.length)
//     test.assertEqual(3, t1.exit.recordType)
//     test.assertEqual("Más de 60 min entre fichajes", t1.alarm)
// }

// function testTripsMaxBetweenPunches2() {
//     let d = time.date(2019, 11, 25, 10)

//     let punches: lib.Punch[] = [
//         { workerCode: 1, date: d, recordType: 15 },
//         { workerCode: 1, date: d.addMinutes(10), recordType: 10 },
//         { workerCode: 1, date: d.addMinutes(51), recordType: 15 },
//     ]

//     let trips = lib.getTrips(punches)

//     test.assertEqual(2, trips.length)

//     let t1 = trips[0]
//     test.assertEqual(2, t1.punches.length)
//     test.assertEqual(1, t1.enters.length)
//     test.assertEqual(10, t1.exit.recordType)

//     let t2 = trips[1]
//     test.assertEqual(1, t2.punches.length)
//     test.assertEqual(1, t2.enters.length)
//     test.assertNull(t2.exit)
//     test.assertEqual("Sin salida", t2.alarm)
// }

// function testPeriodReport1() {
//     newTestContext()

//     let d = time.date(2020, 10, 1, 10)

//     let punches: lib.Punch[] = [
//         { workerCode: 1, date: d, recordType: 15 },
//         { workerCode: 1, date: d.addMinutes(10), recordType: 10 },
//         { workerCode: 1, date: d.addMinutes(50), recordType: 3 },
//     ]

//     runtime.exec("attendance.savePunches", punches)

//     let table = reports.periodReport(d.startOfDay(), d.endOfDay())

//     for (let i = 1, l = table.length; i < l; i++) {
//         let item = table[i]

//         switch (i) {
//             case 4:
//             case 11:
//                 if (item[1] != 1 || item[2] != 0) {
//                     throw json.marshal(item)
//                 }
//                 break

//             case 16:
//                 if (item[1] != 0 || item[2] != 1) {
//                     throw json.marshal(item)
//                 }
//                 break

//             default:
//                 if (item[1] != 0 || item[2] != 0) {
//                     throw json.marshal(item)
//                 }
//                 break
//         }
//     }
// }

// function testPeriodReport2() {
//     newTestContext()

//     let d = time.date(2020, 10, 1, 10)

//     let punches: lib.Punch[] = [
//         { workerCode: 1, date: d, recordType: 15 },
//         { workerCode: 1, date: d.addMinutes(10), recordType: 10 },
//         { workerCode: 1, date: d.addMinutes(50), recordType: 3 },
//         { workerCode: 2, date: d, recordType: 8 },
//         { workerCode: 2, date: d.addMinutes(10), recordType: 0 },
//         { workerCode: 2, date: d.addMinutes(50), recordType: 15 },
//     ]

//     runtime.exec("attendance.savePunches", punches)

//     let table = reports.periodReport(d.startOfDay(), d.endOfDay())

//     for (let i = 1, l = table.length; i < l; i++) {
//         let item = table[i]

//         switch (i) {
//             case 1:
//             case 4:
//             case 9:
//             case 11:
//                 if (item[1] != 1 || item[2] != 0) {
//                     throw json.marshal(item)
//                 }
//                 break

//             case 16:
//                 if (item[1] != 0 || item[2] != 2) {
//                     throw json.marshal(item)
//                 }
//                 break

//             default:
//                 if (item[1] != 0 || item[2] != 0) {
//                     throw json.marshal(item)
//                 }
//                 break
//         }
//     }
// }

// function testMonthReport1() {
//     newTestContext()

//     let d = time.date(2020, 10, 1, 10)

//     let punches: lib.Punch[] = [
//         { workerCode: 1, date: d, recordType: 15 },
//         { workerCode: 1, date: d.addMinutes(10), recordType: 10 },
//         { workerCode: 1, date: d.addMinutes(50), recordType: 3 },
//     ]

//     runtime.exec("attendance.savePunches", punches)

//     let table = reports.monthReport(d.startOfDay(), d.endOfDay())

//     for (let i = 1, l = table.length; i < l; i++) {
//         let item = table[i]

//         switch (i) {
//             case 4:
//             case 11:
//                 if (item[1] != 1 || item[2] != 1) {
//                     throw json.marshal(item)
//                 }
//                 break

//             case 17: // porque va despues de total
//                 if (item[1] != 1 || item[2] != 1) {
//                     throw json.marshal(item)
//                 }
//                 break

//             case 16:
//                 // no debe contar HOSPITAL
//                 if (item[0] != "Total" || item[1] != 2 || item[2] != null) {
//                     throw json.marshal(item)
//                 }
//                 break

//             default:
//                 if (item[1] != 0 || item[2] != 0) {
//                     throw json.marshal(item)
//                 }
//                 break
//         }
//     }
// }



// function newTestContext() {
//     test.initDBPlugins("attendance")
//     test.setCurrentPlugin("attendance")
// }