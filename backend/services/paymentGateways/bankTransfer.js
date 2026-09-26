module.exports = {
  code: 'bank_transfer',
  name: 'Bank Transfer',
  logo: '',
  configFields: [
    { key: 'accountName', label: 'Account Name', type: 'text' },
    { key: 'accountNumber', label: 'Account Number', type: 'text', secret: true },
    { key: 'ifsc', label: 'IFSC Code', type: 'text' },
    { key: 'bankName', label: 'Bank Name', type: 'text' },
  ],
  defaultInstructions: 'Transfer the order amount to our bank account and share the reference number with support.',
};
