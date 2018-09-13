import { Document, Schema, Model, model } from 'mongoose';
import { IProject } from '../../models/project';

export interface IProjectModel extends IProject, Document {}

export var ProjectSchema: Schema = new Schema(
	{
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
			requiredClaims: Number,
			sdgs: [Number],
			claimStats: {
				currentSuccessful: {
					type: Number,
					default: 0
				},
				currentRejected: {
					type: Number,
					default: 0
				}
			},
			claims: [
				{
					date: Date,
					location: {
						long: String,
						lat: String
					},
					claimId: String,
					status: String,
					saDid: String,
					eaDid: String
				}
			],
			templates: {
				claim: {
					schema: String,
					form: String
				}
			},
			agentStats: {
				evaluators: {
					type: Number,
					default: 0
				},
				evaluatorsPending: {
					type: Number,
					default: 0
				},
				serviceProviders: {
					type: Number,
					default: 0
				},
				serviceProvidersPending: {
					type: Number,
					default: 0
				},
				investors: {
					type: Number,
					default: 0
				},
				investorsPending: {
					type: Number,
					default: 0
				}
			},
			agents: [
				{
					did: String,
					status: {
						type: String,
						default: '0'
					},
					kyc: {
						type: Boolean,
						default: false
					},
					role: String
				}
			],
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
		txHash: String,
		status: String
	},
	{ strict: false }
);

ProjectSchema.pre('save', function(this: IProject, next: any) {
	next();
	return this;
});

export const ProjectDB: Model<IProjectModel> = model<IProjectModel>('Project', ProjectSchema);
