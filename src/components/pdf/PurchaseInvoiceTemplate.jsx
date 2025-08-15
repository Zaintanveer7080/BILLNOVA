import React from 'react';

const PurchaseInvoiceTemplate = ({ purchase, supplier, items, settings, getInvoiceStatus }) => {
  const { status, balance } = getInvoiceStatus(purchase);
  const { companyName, companyLogo } = settings;

  return (
    <div style={{ width: '210mm', minHeight: '297mm', padding: '20mm', fontFamily: 'sans-serif', color: '#000', background: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {companyLogo && <img src={companyLogo} alt="Company Logo" style={{ width: '50px', height: '50px', marginRight: '15px' }} />}
          <div>
            <h1 style={{ fontSize: '28px', margin: 0, color: '#1a237e' }}>Purchase Invoice</h1>
            <p style={{ margin: '5px 0 0', fontSize: '14px' }}>Invoice #: {purchase.purchaseNumber}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{companyName}</p>
          <p style={{ margin: '5px 0 0', fontSize: '12px' }}>Date: {new Date().toLocaleDateString()}</p>
        </div>
      </header>

      <section style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '14px', margin: '0 0 5px 0', color: '#555' }}>SUPPLIER</h2>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{supplier?.name}</p>
          <p style={{ margin: '5px 0 0', fontSize: '12px' }}>{supplier?.contact}</p>
          <p style={{ margin: '5px 0 0', fontSize: '12px' }}>{supplier?.address}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}><strong>Invoice Date:</strong> {new Date(purchase.date).toLocaleDateString()}</p>
          <p style={{ margin: '5px 0 0' }}><strong>Status:</strong> <span style={{ fontWeight: 'bold', color: status === 'Paid' ? 'green' : 'red' }}>{status}</span></p>
        </div>
      </section>

      <section style={{ marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#eeeeee' }}>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Item</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'right' }}>Qty</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'right' }}>Price</th>
              <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {purchase.items.map((item, idx) => {
              const itemDetails = items.find(i => i.id === item.itemId);
              return (
                <tr key={item.itemId} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ border: '1px solid #ccc', padding: '10px' }}>{itemDetails?.name || 'N/A'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'right' }}>{item.quantity} {itemDetails?.unit}</td>
                  <td style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'right' }}>RS {item.price.toFixed(2)}</td>
                  <td style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'right' }}>RS {(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          {purchase.notes && (
            <>
              <h3 style={{ fontSize: '14px', margin: '0 0 5px 0' }}>Notes</h3>
              <p style={{ fontSize: '12px', margin: 0 }}>{purchase.notes}</p>
            </>
          )}
        </div>
        <div style={{ width: '250px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}><span>Subtotal</span><span>RS {purchase.subTotal.toFixed(2)}</span></div>
          {purchase.discount?.value > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}><span>Discount</span><span>- RS {(purchase.subTotal - purchase.totalCost).toFixed(2)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #ccc', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}><span>Total</span><span>RS {purchase.totalCost.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}><span>Paid</span><span>RS {(purchase.totalCost - balance).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontWeight: 'bold' }}><span>Balance Due</span><span>RS {balance.toFixed(2)}</span></div>
        </div>
      </section>

      <footer style={{ position: 'absolute', bottom: '20mm', left: '20mm', right: '20mm', textAlign: 'center', fontSize: '12px', color: '#777', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
        <p>Page 1 of 1</p>
      </footer>
    </div>
  );
};

export default PurchaseInvoiceTemplate;