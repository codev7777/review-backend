"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const campaign_service_1 = __importDefault(require("../services/campaign.service"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const createCampaign = (0, catchAsync_1.default)(async (req, res) => {
    if (!req.user || !('companyId' in req.user)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User must be associated with a company');
    }
    if (req.body.productIds && typeof req.body.productIds === 'string') {
        req.body.productIds = req.body.productIds
            .split(',')
            .map((id) => parseInt(id.trim(), 10));
    }
    if (req.body.marketplaces && typeof req.body.marketplaces === 'string') {
        req.body.marketplaces = req.body.marketplaces.split(',').map((m) => m.trim());
    }
    const campaignData = {
        ...req.body,
        companyId: req.user.companyId
    };
    const campaign = await campaign_service_1.default.createCampaign(campaignData);
    res.status(http_status_1.default.CREATED).send(campaign);
});
const getCampaigns = (0, catchAsync_1.default)(async (req, res) => {
    const query = {};
    if (req.query.title)
        query.title = req.query.title;
    if (req.query.isActive)
        query.isActive = req.query.isActive;
    if (req.query.promotionId)
        query.promotionId = Number(req.query.promotionId);
    if (req.query.companyId)
        query.companyId = Number(req.query.companyId);
    if (req.query.claims)
        query.claims = Number(req.query.claims);
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const result = await campaign_service_1.default.queryCampaigns(query, {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        limit,
        page
    });
    res.send(result);
});
const getCampaign = (0, catchAsync_1.default)(async (req, res) => {
    const campaign = await campaign_service_1.default.getCampaignById(Number(req.params.campaignId));
    if (!campaign) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Campaign not found');
    }
    const campaignWithRelations = {
        ...campaign,
        products: campaign.products || [],
        promotion: campaign.promotion || null,
        company: campaign.company || null
    };
    res.send(campaignWithRelations);
});
const updateCampaign = (0, catchAsync_1.default)(async (req, res) => {
    const campaign = await campaign_service_1.default.updateCampaignById(Number(req.params.campaignId), req.body);
    res.send(campaign);
});
const deleteCampaign = (0, catchAsync_1.default)(async (req, res) => {
    await campaign_service_1.default.deleteCampaignById(Number(req.params.campaignId));
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.default = {
    createCampaign,
    getCampaigns,
    getCampaign,
    updateCampaign,
    deleteCampaign
};
//# sourceMappingURL=campaign.controller.js.map