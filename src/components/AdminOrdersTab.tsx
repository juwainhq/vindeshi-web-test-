import { useState } from 'react';

export function AdminOrdersTab() {
  const [message, setMessage] = useState('');

  // This is a placeholder - in a real app you might fetch from an email API or just show a message
  // For now, we'll show a static message
  return (
    <div className="py-10 text-center">
      <div className="flex items-center justify-center mb-6">
        <div className="h-12 w-12 rounded-full bg-[#a05a39]/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#a05a39]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.192 1.291.494l1.158 2.475A11.25 11.25 0 0012 10.425a11.25 11.25 0 004.217-1.456l1.158-2.475c.336-.302.781-.494 1.291-.494H21.75m-9 7.5a5.25 5.25 0 110-10.5 5.25 5.25 0 010 10.5z" />
          </svg>
        </div>
      </div>
      <h2 className="mb-4 text-2xl font-serif tracking-tight text-[#171717]">
        Orders are sent via email
      </h2>
      <p className="max-w-md mx-auto text-lg text-black/60 leading-relaxed">
        When customers place an order, the details are emailed to you instantly via Formspree.
        No orders are stored in the database or admin panel. Please check your email for new orders.
      </p>
      {message && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-xs font-bold uppercase tracking-wide transition hover:bg-black/5">
          {message}
        </div>
      )}
    </div>
  );
}