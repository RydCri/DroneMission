import "./dashboard/map.js";
import "./dashboard/missionBuilder.js";
import "./dashboard/tree.js"
import { exportMissionJSON , generateKML, closeBatchEditor, closeWaypointEditor, openBatchEditor} from "./dashboard/tree.js";
import { missions, waypoints, openWaypointEditor} from "./dashboard/missionBuilder.js";

window.exportMissionJSON = exportMissionJSON;
window.closeBatchEditor = closeBatchEditor;
window.openBatchEditor = openBatchEditor;
window.closeWaypointEditor = closeWaypointEditor;
window.openWaypointEditor = openWaypointEditor;
window.generateKML = generateKML;
window.missions = missions;
window.waypoints = waypoints;

