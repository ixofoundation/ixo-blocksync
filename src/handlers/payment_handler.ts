import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/prisma_client";

export const createPaymentTemplate = async (
    paymentTemplateDoc: Prisma.PaymentTemplateCreateInput,
) => {
    try {
        return prisma.paymentTemplate.create({ data: paymentTemplateDoc });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createPaymentContract = async (
    paymentContractDoc: Prisma.PaymentContractUncheckedCreateInput,
) => {
    try {
        return prisma.paymentContract.create({ data: paymentContractDoc });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createSubscription = async (
    subscriptionDoc: Prisma.SubscriptionUncheckedCreateInput,
) => {
    try {
        return prisma.subscription.create({ data: subscriptionDoc });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const setPaymentContractAuthorisation = async (paymentContractDoc: {
    id: string;
    authorised: boolean;
    payerDid: string;
}) => {
    try {
        return prisma.paymentContract.update({
            where: {
                id: String(paymentContractDoc.id),
            },
            data: {
                authorised: paymentContractDoc.authorised,
                payerDid: paymentContractDoc.payerDid,
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const grantDiscount = async (
    discountDoc: Prisma.DiscountUncheckedCreateInput,
) => {
    try {
        return prisma.discount.create({ data: discountDoc });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const revokeDiscount = async (discountDoc: {
    senderDid: string;
    paymentContractId: string;
    holder: string;
}) => {
    try {
        return prisma.discount.updateMany({
            where: {
                paymentContractId: discountDoc.paymentContractId,
                recipient: discountDoc.holder,
            },
            data: {
                revoked: true,
                revoker: discountDoc.senderDid,
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const effectPayment = async (paymentContractDoc: {
    senderDid: string;
    paymentContractId: string;
}) => {
    try {
        return prisma.paymentContract.update({
            where: {
                id: paymentContractDoc.paymentContractId,
            },
            data: {
                effected: true,
                senderDid: paymentContractDoc.senderDid,
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getPaymentTemplateById = async (id: string) => {
    try {
        return prisma.paymentTemplate.findFirst({ where: { id: id } });
    } catch (error) {
        console.log(error);
        return;
    }
};
