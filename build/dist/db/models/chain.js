"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
exports.ChainSchema = new mongoose_1.Schema({
    chainId: {
        type: String,
        index: true,
        unique: true
    },
    blockHeight: {
        type: Number,
    }
}, { strict: false });
exports.ChainSchema.pre('save', function (next) {
    exports.ChainDB.find({}, function (err, docs) {
        if (docs.length < 1) {
            next();
        }
        else {
            next(new Error("Only one chain document allowed!"));
        }
    });
});
exports.ChainDB = mongoose_1.model('Chain', exports.ChainSchema);
//# sourceMappingURL=chain.js.map