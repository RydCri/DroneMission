import "./map.js";
import "./missionBuilder.js";
import "./tree.js"
import { exportMissionJSON , generateKML, closeBatchEditor, closeWaypointEditor, openBatchEditor} from "./tree.js";
import { missions, waypoints, openWaypointEditor} from "./missionBuilder.js";

window.exportMissionJSON = exportMissionJSON;
window.closeBatchEditor = closeBatchEditor;
window.openBatchEditor = openBatchEditor;
window.closeWaypointEditor = closeWaypointEditor;
window.openWaypointEditor = openWaypointEditor;
window.generateKML = generateKML;
window.missions = missions;
window.waypoints = waypoints;

