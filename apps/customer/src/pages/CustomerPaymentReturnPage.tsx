import { useEffect,useState } from 'react';
import { Link,useParams } from 'react-router-dom';
import { CustomerPageHeader } from '../components/CustomerPageHeader';
import { CustomerStatusBadge } from '../components/CustomerStatusBadge';
import { useCustomerOperation } from '../hooks/useCustomerOperations';

interface CustomerPaymentReturnPageProps {outcome:'success'|'cancelled'|'failed'}

export function CustomerPaymentReturnPage({outcome}:CustomerPaymentReturnPageProps){
  const {operationId}=useParams();
  const {operation,loading,error,refresh}=useCustomerOperation(operationId);
  const confirmed=operation?.paymentStatus==='PAID';
  const [checking,setChecking]=useState(false);
  const [statusMessage,setStatusMessage]=useState('');
  useEffect(()=>{if(checking&&!loading){setChecking(false);setStatusMessage(confirmed?'Payment confirmed.':'Still awaiting secure confirmation from Yoco.')}},[checking,loading,confirmed]);
  const checkStatus=()=>{if(checking)return;setChecking(true);setStatusMessage('');refresh()};
  const content=outcome==='success'
    ?{eyebrow:'PAYMENT VERIFICATION',title:confirmed?'Payment confirmed':'Confirming your payment',message:confirmed?'Your payment has been verified and your operation can now move into preparation.':'Your checkout was completed. We are waiting for secure confirmation from Yoco; this page does not mark the operation as paid.'}
    :outcome==='cancelled'
      ?{eyebrow:'CHECKOUT CANCELLED',title:'Payment not completed',message:'No payment confirmation was received. Your operation remains available for payment when you are ready.'}
      :{eyebrow:'PAYMENT ATTEMPT',title:'Payment unsuccessful',message:'The payment could not be completed. Your operation remains awaiting payment and you may try again.'};
  return <main className="client-main payment-return-page">
    <CustomerPageHeader eyebrow={content.eyebrow} title={content.title} description={content.message} actions={operation?<CustomerStatusBadge status={operation.status}/>:undefined}/>
    <section className={`payment-return-card payment-return-card--${outcome}`} aria-live="polite">
      {loading?<p>Retrieving the latest secure operation status…</p>:error?<><p role="alert">{error}</p><button className="customer-primary" type="button" onClick={refresh}>Try again</button></>:<>
        <span>{confirmed?'CONFIRMED':outcome==='success'?'VERIFICATION PENDING':'PAYMENT PENDING'}</span>
        <strong>{operation?.operationId??operationId}</strong>
        <p>{content.message}</p>
        <div><Link className="client-button-link" to={`/operations/${encodeURIComponent(operationId??'')}`}>Return to operation</Link>{outcome==='success'&&!confirmed&&<button className="customer-primary" type="button" disabled={checking} onClick={checkStatus}>{checking?'Checking status…':'Check status'}</button>}</div>
        {statusMessage&&<p role="status">{statusMessage}</p>}
      </>}
    </section>
  </main>;
}
