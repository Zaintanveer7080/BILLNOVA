import React from 'react';

const StockSummaryReportTemplate = ({ data, settings, totalValue }) => {
  const { companyName, companyLogo } = settings;

  return (
    <div style={{ width: '210mm', minHeight: '297mm', padding: '20mm', fontFamily: 'sans-serif', color: '#000', background: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {companyLogo && <img src={companyLogo} alt="Company Logo" style={{ width: '50px', height: '50px', marginRight: '15px' }} />}
          <div>
            <h1 style={{ fontSize: '28px', margin: 0, color: '#1a237e' }}>Stock Summary Report</h1>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{companyName}</p>
          <p style={{ margin: '5px 0 0', fontSize: '12px' }}>Date: {new Date().toLocaleDateString()}</p>
        </div>
      </header>

      <section style={{ marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead style={{ backgroundColor: '#eeeeee' }}>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>SKU</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Item Name</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Quantity</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Pur. Price</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Sale Price</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Total Value</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.sku}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.name}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{item.currentStock} {item.unit}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>RS {item.purchasePrice?.toFixed(2)}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>RS {item.salePrice?.toFixed(2)}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>RS {item.stockValue.toFixed(2)}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.status}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#eeeeee' }}>
              <td colSpan="5" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>Total Stock Value</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>RS {totalValue.toFixed(2)}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}></td>
            </tr>
          </tfoot>
        </table>
      </section>

      <footer style={{ position: 'absolute', bottom: '20mm', left: '20mm', right: '20mm', textAlign: 'center', fontSize: '12px', color: '#777', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
        <p>Page 1 of 1</p>
      </footer>
    </div>
  );
};

export default StockSummaryReportTemplate;