"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const client_1 = __importDefault(require("../client"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const fileUpload_1 = require("../utils/fileUpload");
const createCompany = async (companyBody) => {
    var _a, _b;
    const { logo, Plan, ...rest } = companyBody;
    let logoPath = null;
    if (typeof logo === 'string' && logo.startsWith('data:image')) {
        logoPath = await (0, fileUpload_1.saveCompanyLogo)(logo);
    }
    const data = {
        ...rest,
        ratio: (_a = rest.ratio) !== null && _a !== void 0 ? _a : 0,
        reviews: (_b = rest.reviews) !== null && _b !== void 0 ? _b : 0,
        Plan: undefined,
        logo: logoPath
    };
    return client_1.default.company.create({
        data
    });
};
const queryCompanies = async (filter, options) => {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = options.sortBy;
    const sortType = options.sortType || 'desc';
    const where = { ...filter };
    const companies = await client_1.default.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortType } : undefined
    });
    return companies;
};
const getCompanyById = async (id) => {
    const company = await client_1.default.company.findUnique({
        where: { id }
    });
    if (!company) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Company not found');
    }
    return company;
};
const updateCompanyById = async (companyId, updateBody) => {
    const company = await getCompanyById(companyId);
    if (!company) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Company not found');
    }
    const { logo, ...updateData } = updateBody;
    let logoPath = company.logo;
    if (logo) {
        if (typeof logo === 'string' && logo.startsWith('data:image')) {
            if (company.logo) {
                await (0, fileUpload_1.deleteImage)(company.logo);
            }
            logoPath = await (0, fileUpload_1.saveCompanyLogo)(logo);
        }
        else if (logo === null) {
            if (company.logo) {
                await (0, fileUpload_1.deleteImage)(company.logo);
            }
            logoPath = null;
        }
    }
    return client_1.default.company.update({
        where: { id: companyId },
        data: {
            ...updateData,
            logo: logoPath
        }
    });
};
const deleteCompanyById = async (companyId) => {
    const company = await getCompanyById(companyId);
    if (!company) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Company not found');
    }
    if (company.logo) {
        await (0, fileUpload_1.deleteImage)(company.logo);
    }
    await client_1.default.company.delete({ where: { id: companyId } });
    return company;
};
exports.default = {
    createCompany,
    queryCompanies,
    getCompanyById,
    updateCompanyById,
    deleteCompanyById
};
//# sourceMappingURL=company.service.js.map