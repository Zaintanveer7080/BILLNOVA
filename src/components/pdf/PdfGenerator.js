import ReactDOM from 'react-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdf = (component, filename) => {
  const viewport = document.getElementById('pdf-viewport');
  if (!viewport) {
    console.error("PDF viewport not found. Make sure it's rendered in your App component.");
    return;
  }

  const pdfContainer = document.createElement('div');
  viewport.appendChild(pdfContainer);

  ReactDOM.render(component, pdfContainer, () => {
    setTimeout(() => {
      html2canvas(pdfContainer.children[0], { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth;
        const height = width / ratio;

        let finalHeight = height;
        if (height > pdfHeight) {
          finalHeight = pdfHeight;
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, width, finalHeight);
        pdf.save(filename);

        ReactDOM.unmountComponentAtNode(pdfContainer);
        viewport.removeChild(pdfContainer);
      });
    }, 500);
  });
};