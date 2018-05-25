"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
exports.ProjectSchema = new mongoose_1.Schema({
    txHash: {
        type: String,
        index: true,
        unique: true
    },
    senderDid: {
        type: String,
        index: true,
    },
    projectDid: {
        type: String,
        index: true,
    },
    pubKey: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        required: true
    },
    longDescription: {
        type: String,
        required: false
    },
    impactAction: {
        type: String,
        required: true
    },
    createdOn: {
        type: Date,
        required: true
    },
    createdBy: {
        type: String,
        index: true,
    },
    country: {
        type: String,
        index: true,
        required: true
    },
    sdgs: {
        type: [String],
        required: true
    },
    impactsRequired: {
        type: Number,
        required: true
    },
    claimTemplate: {
        type: String,
        required: false,
        default: 'default'
    },
    socialMedia: {
        facebookLink: {
            type: String,
            required: false,
            default: ''
        },
        instagramLink: {
            type: String,
            required: false,
            default: ''
        },
        twitterLink: {
            type: String,
            required: false,
            default: ''
        }
    },
    serviceEndpoint: {
        type: String,
        required: false
    },
    imageLink: {
        type: String,
        required: false
    }
}, { strict: false });
exports.ProjectSchema.pre('save', function (next) {
    next();
    return this;
});
exports.ProjectDB = mongoose_1.model('Project', exports.ProjectSchema);
//# sourceMappingURL=project.js.map