import type { OperationDocument, OperationInternalDocument } from '../../../../../packages/firebase/src';
import type { Operation } from '../../types/operations';

const isRecord=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null;
const asString=(value:unknown,field:string):string=>{if(typeof value!=='string')throw new Error(`Invalid operation field: ${field}`);return value;};
const asNumber=(value:unknown,field:string):number=>{if(typeof value!=='number')throw new Error(`Invalid operation field: ${field}`);return value;};
const asDateString=(value:unknown,field:string):string=>{if(isRecord(value)&&typeof value.toDate==='function')return (value.toDate as ()=>Date)().toISOString();throw new Error(`Invalid operation timestamp: ${field}`);};

export const parseOperationDocument=(value:unknown):OperationDocument=>{
 if(!isRecord(value)||!isRecord(value.package)||!isRecord(value.recipient)||!isRecord(value.delivery)||!isRecord(value.paymentSummary))throw new Error('Invalid authoritative operation document.');
 asString(value.operationId,'operationId');asString(value.customerId,'customerId');asString(value.status,'status');asString(value.package.nameSnapshot,'package.nameSnapshot');asNumber(value.package.priceMinor,'package.priceMinor');asString(value.recipient.name,'recipient.name');asDateString(value.createdAt,'createdAt');
 return value as unknown as OperationDocument;
};

export const parseOperationInternalDocument=(value:unknown):OperationInternalDocument|undefined=>{
 if(value===undefined)return undefined;
 if(!isRecord(value)||!isRecord(value.moderation)||!isRecord(value.delivery))throw new Error('Invalid internal operation document.');
 return value as unknown as OperationInternalDocument;
};

export const mapAdminOperation=(document:OperationDocument,internal?:OperationInternalDocument):Operation=>({
 operationId:document.operationId,customerId:document.customerId,createdAt:asDateString(document.createdAt,'createdAt'),packageType:document.package.nameSnapshot,customerName:'Firebase customer',email:'',phone:'',
 recipientName:document.recipient.name,recipientPhone:document.recipient.phone,campus:document.recipient.campus,residence:document.recipient.residence,deliveryLocation:document.recipient.deliveryLocation,deliveryNotes:document.recipient.deliveryInstructions??'',
 requestedDeliveryDate:document.delivery.requestedDate,requestedDeliveryWindow:document.delivery.requestedWindow,amount:document.paymentSummary.amountMinor/100,paymentStatus:document.paymentSummary.status,paymentReference:document.paymentSummary.status==='NOT_REQUIRED_YET'?'Not requested':document.paymentSummary.status==='PENDING'?'Awaiting payment integration':'Stored in payment boundary',paymentDate:document.paymentSummary.paidAt?asDateString(document.paymentSummary.paidAt,'paymentSummary.paidAt'):null,
 operationStatus:document.status,moderationStatus:internal?.moderation.status??'PENDING',ambassador:document.delivery.assignedAmbassadorId??null,anonymousMessage:document.anonymousMessage,
 rejectionReason:internal?.moderation.reasonNote,cancellationReason:internal?.staffNotes,deliveryFailureReason:internal?.delivery.failureDetails,
 moderationReviewedBy:internal?.moderation.reviewedBy,moderationReviewedAt:internal?.moderation.reviewedAt?asDateString(internal.moderation.reviewedAt,'moderation.reviewedAt'):undefined,
 activity:[],
});
