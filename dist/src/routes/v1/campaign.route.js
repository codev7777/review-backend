"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validate_1 = __importDefault(require("../../middlewares/validate"));
const campaign_validation_1 = __importDefault(require("../../validations/campaign.validation"));
const campaign_controller_1 = __importDefault(require("../../controllers/campaign.controller"));
const router = express_1.default.Router();
router
    .route('/')
    .post((0, auth_1.default)(), (0, validate_1.default)(campaign_validation_1.default.createCampaign), campaign_controller_1.default.createCampaign)
    .get((0, validate_1.default)(campaign_validation_1.default.getCampaigns), campaign_controller_1.default.getCampaigns);
router
    .route('/:campaignId')
    .get((0, validate_1.default)(campaign_validation_1.default.getCampaign), campaign_controller_1.default.getCampaign)
    .patch((0, auth_1.default)(), (0, validate_1.default)(campaign_validation_1.default.updateCampaign), campaign_controller_1.default.updateCampaign)
    .delete((0, auth_1.default)(), (0, validate_1.default)(campaign_validation_1.default.deleteCampaign), campaign_controller_1.default.deleteCampaign);
exports.default = router;
//# sourceMappingURL=campaign.route.js.map