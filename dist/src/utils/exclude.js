"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exclude = (obj, keys) => {
    for (const key of keys) {
        delete obj[key];
    }
    return obj;
};
exports.default = exclude;
//# sourceMappingURL=exclude.js.map