import { Hono } from "hono";
import { fanController } from "../controllers/fanController";

// Create a fan router
const fanRouter = new Hono();

// Define routes
fanRouter.get("/", fanController.getAllFans);
fanRouter.get("/:id", fanController.getFanById);
fanRouter.post("/", fanController.createFan);
fanRouter.put("/:id", fanController.updateFan);
fanRouter.delete("/:id", fanController.deleteFan);
fanRouter.post("/:id/toggle", fanController.toggleFanState);
fanRouter.post("/:id/speed", fanController.setFanSpeed);

export default fanRouter;
