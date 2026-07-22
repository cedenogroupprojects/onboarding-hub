-- Default stage lists per track. Leadership can rename/reorder these later from the UI;
-- nothing in the app hardcodes these names except the Google Sheets sync, which watches
-- for the "team" track reaching a stage literally named "Onboarded".

insert into stages (track, name, sort_order) values
  ('team', 'New Lead', 1),
  ('team', 'Contacted', 2),
  ('team', 'Application Sent', 3),
  ('team', 'Application Received', 4),
  ('team', 'Interview Scheduled', 5),
  ('team', 'Offer Sent', 6),
  ('team', 'Paperwork', 7),
  ('team', 'Onboarded', 8),

  ('roa_newbuild', 'New Lead', 1),
  ('roa_newbuild', 'Contacted', 2),
  ('roa_newbuild', 'Consultation Scheduled', 3),
  ('roa_newbuild', 'Consultation Completed', 4),
  ('roa_newbuild', 'Enrolled', 5),
  ('roa_newbuild', 'Onboarding', 6),
  ('roa_newbuild', 'Onboarded', 7),

  ('mastermind', 'New Lead', 1),
  ('mastermind', 'Payment Pending', 2),
  ('mastermind', 'Paid', 3),
  ('mastermind', 'Welcome Sent', 4),
  ('mastermind', 'Onboarded', 5);
