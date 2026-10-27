// Dropdown choices for declining a request. `text` is the sentence the customer sees in the email.
// Add, remove or reword reasons here.
export const DECLINE_REASONS = {
  unavailable: {
    label: 'Not enough totes for those dates',
    text: "We don't have enough totes available for the dates you requested.",
  },
  schedule: {
    label: "Delivery/pickup dates don't fit our schedule",
    text: "We're unable to make delivery or pickup on the dates you requested.",
  },
  area: {
    label: 'Outside our service area',
    text: "One of your addresses is outside the area we can currently serve.",
  },
  incomplete: {
    label: 'Missing or unclear information',
    text: "We weren't able to complete your request with the information provided.",
  },
  duplicate: {
    label: 'Duplicate request',
    text: 'This looks like a duplicate of another request, so we are closing it out.',
  },
  other: {
    label: 'Other (explain in the note)',
    text: '',
  },
};
