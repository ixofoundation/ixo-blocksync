import { Document, Schema, Model, model } from 'mongoose';
import { IProject } from '../../models/project';

export interface IProjectModel extends IProject, Document {
}

export var ProjectSchema: Schema = new Schema({
    data: {
        title: String,
        ownerName: String,
        ownerEmail: String,
        shortDescription: String,
        longDescription: String,
        impactAction: String,
        createdOn: Date,
        createdBy: String,
        projectLocation: String,
        sdgs: [Number],
        claims: {
            required: {
                type: Number,
                required: true,
                default: 0
            },
            currentSuccessful: {
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
        evaluatorPayPerClaim: String,
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
        serviceEndpoint: String,
        imageLink: String,
        founder: {
            name: String,
            email: String,
            countryOfOrigin: String,
            shortDescription: String,
            websiteURL: String,
            logoLink: String
        }
    },
    projectDid: {
        type: String,
        required: true,
        index: { unique: true, dropDups: true }
    },
    pubKey: String,
    senderDid: String,
    txHash: String
}, { strict: false });

ProjectSchema.pre('save', function (this: IProject, next: any) {
    next();
    return this;
});

export const ProjectDB: Model<IProjectModel> = model<IProjectModel>('Project', ProjectSchema);