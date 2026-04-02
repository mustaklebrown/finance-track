import('html2pdf.js').then(module => {
  console.log('Successfully imported html2pdf');
  console.log(typeof module.default);
}).catch(err => {
  console.error('Failed to import html2pdf', err);
});
