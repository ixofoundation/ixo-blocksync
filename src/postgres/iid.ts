import { pool } from "./client";

export type Iid = {
  id: string;
  context: any; // JSON
  controller: string[];
  verificationMethod: any; // JSON
  service: any; // JSON
  authentication: string[];
  assertionMethod: string[];
  keyAgreement: string[];
  capabilityInvocation: string[];
  capabilityDelegation: string[];
  linkedResource: any; // JSON
  linkedClaim: any; // JSON
  accordedRight: any; // JSON
  linkedEntity: any; // JSON
  alsoKnownAs: string;
  metadata: any; // JSON
};

const createIidSql = `
INSERT INTO "IID" ( "id", "context", "controller", "verificationMethod", "service", "authentication", "assertionMethod", "keyAgreement", "capabilityInvocation", "capabilityDelegation", "linkedResource", "linkedClaim", "accordedRight", "linkedEntity", "alsoKnownAs", "metadata") 
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16 );
`;
export const createIid = async (p: Iid): Promise<void> => {
  try {
    await pool.query(createIidSql, [
      p.id,
      JSON.stringify(p.context),
      p.controller,
      JSON.stringify(p.verificationMethod),
      JSON.stringify(p.service),
      p.authentication,
      p.assertionMethod,
      p.keyAgreement,
      p.capabilityInvocation,
      p.capabilityDelegation,
      JSON.stringify(p.linkedResource),
      JSON.stringify(p.linkedClaim),
      JSON.stringify(p.accordedRight),
      JSON.stringify(p.linkedEntity),
      p.alsoKnownAs,
      JSON.stringify(p.metadata),
    ]);
  } catch (error) {
    throw error;
  }
};

const updateIidSql = `
UPDATE "IID"
SET
	             "context" = $1,
	          "controller" = $2,
	  "verificationMethod" = $3,
	             "service" = $4,
	      "authentication" = $5,
	     "assertionMethod" = $6,
	        "keyAgreement" = $7,
	"capabilityInvocation" = $8,
	"capabilityDelegation" = $9,
	      "linkedResource" = $10,
	         "linkedClaim" = $11,
	       "accordedRight" = $12,
	        "linkedEntity" = $13,
	         "alsoKnownAs" = $14,
	            "metadata" = $15
WHERE
	                  "id" = $16;
`;
export const updateIid = async (p: Iid): Promise<void> => {
  try {
    await pool.query(updateIidSql, [
      JSON.stringify(p.context),
      p.controller,
      JSON.stringify(p.verificationMethod),
      JSON.stringify(p.service),
      p.authentication,
      p.assertionMethod,
      p.keyAgreement,
      p.capabilityInvocation,
      p.capabilityDelegation,
      JSON.stringify(p.linkedResource),
      JSON.stringify(p.linkedClaim),
      JSON.stringify(p.accordedRight),
      JSON.stringify(p.linkedEntity),
      p.alsoKnownAs,
      JSON.stringify(p.metadata),
      p.id,
    ]);
  } catch (error) {
    throw error;
  }
};
