"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
exports.ProjectSchema = new mongoose_1.Schema({
    ownerName: {
        type: String,
    },
    ownerEmail: {
        type: String,
    },
    projectDid: {
        type: String,
        index: true,
        unique: true
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
    },
    projectLocation: {
        type: String,
        required: true
    },
    estimatedProjectDuration: {
        type: Number,
        required: true
    },
    sdgs: {
        type: [Number],
        required: true
    },
    claimsRequired: {
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
        },
        webLink: {
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
    },
    founder: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        countryOfOrigin: {
            type: String,
            required: true
        },
        shortDescription: {
            type: String,
            required: false
        },
        websiteURL: {
            type: String,
            required: false
        },
        logoLink: {
            type: String,
            required: false
        }
    }
}, { strict: false });
exports.ProjectSchema.pre('save', function (next) {
    next();
    return this;
});
exports.ProjectDB = mongoose_1.model('Project', exports.ProjectSchema);
//# sourceMappingURL=project.js.map