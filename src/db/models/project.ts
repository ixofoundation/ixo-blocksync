import { Document, Schema, Model, model } from 'mongoose';
import { IProject } from '../../models/project';

export interface IProjectModel extends IProject, Document {
}

export var ProjectSchema: Schema = new Schema({
    title: {
        type: String,
        required: true
    },
    projectDid: {
        type: String,
        index: true,
        unique: true,
        required: true
    },
    ownerName: {
        type: String,
        required: true
    },
    ownerEmail: {
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
    },
    projectLocation: {
        type: String,
        required: true
    },
    sdgs: {
        type: [Number],
        required: true
    },
    claims: {
        required: {
            type: Number,
            required: true,
            default: 0
        },
        currentSucessful: {
            type: Number,
            required: true,
            default: 0
        },
        currentRejected: {
            type: Number,
            required: true,
            default: 0
        }
    },
    templates: {
        claim: {
            type: String,
            required: true,
            default: 'default'
        }
    },
    agents: {
        evaluators: {
            type: Number,
            required: true,
            default: 0
        },
        evaluatorsPending: {
            type: Number,
            required: true,
            default: 0
        },
        serviceProviders: {
            type: Number,
            required: true,
            default: 0
        },
        serviceProvidersPending: {
            type: Number,
            required: true,
            default: 0
        },
        investors: {
            type: Number,
            required: true,
            default: 0
        },
    },
    evaluatorPayPerClaim: {
        type: Number,
        required: true,
        default: 0
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
    ixo: {
        totalStaked: {
            type: Number,
            required: true,
            default: 0
        },
        totalUsed: {
            type: Number,
            required: true,
            default: 0
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

ProjectSchema.pre('save', function (this: IProject, next: any) {
    next();
    return this;
});

export const ProjectDB: Model<IProjectModel> = model<IProjectModel>('Project', ProjectSchema);