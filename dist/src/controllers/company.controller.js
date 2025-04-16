"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const pick_1 = __importDefault(require("../utils/pick"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const services_1 = require("../services");
const createCompany = (0, catchAsync_1.default)(async (req, res) => {
    const { planId, ...rest } = req.body;
    const company = await services_1.companyService.createCompany(rest);
    if (req.user) {
        const user = req.user;
        await services_1.userService.updateUserById(user.id, {
            company: { connect: { id: company.id } }
        });
    }
    res.status(http_status_1.default.CREATED).send(company);
});
const getCompanies = (0, catchAsync_1.default)(async (req, res) => {
    const filter = (0, pick_1.default)(req.query, ['name']);
    const options = (0, pick_1.default)(req.query, ['sortBy', 'limit', 'page']);
    const result = await services_1.companyService.queryCompanies(filter, options);
    res.send(result);
});
const getCompany = (0, catchAsync_1.default)(async (req, res) => {
    const company = await services_1.companyService.getCompanyById(Number(req.params.companyId));
    if (!company) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Company not found');
    }
    res.send(company);
});
const updateCompany = (0, catchAsync_1.default)(async (req, res) => {
    const company = await services_1.companyService.updateCompanyById(Number(req.params.companyId), req.body);
    if (req.user && company) {
        const user = req.user;
        if (user.companyId !== company.id) {
            await services_1.userService.updateUserById(user.id, {
                company: { connect: { id: company.id } }
            });
        }
    }
    res.send(company);
});
const deleteCompany = (0, catchAsync_1.default)(async (req, res) => {
    await services_1.companyService.deleteCompanyById(Number(req.params.companyId));
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.default = {
    createCompany,
    getCompanies,
    getCompany,
    updateCompany,
    deleteCompany
};
//# sourceMappingURL=company.controller.js.map