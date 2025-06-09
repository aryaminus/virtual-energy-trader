# One-Shot Prompt

Build a full-stack web application called 'Virtual Energy Trader' that simulates energy trading in day-ahead and real-time markets. The application should allow users to place bids, visualize historical market data from gridstatus.io, and calculate profits or losses based on simulated trading scenarios. This is a new project for the Bolt hackathon, built after May 30, 2025, and must be deployed on Bolt.new with the 'Built on Bolt' badge.

**Project Overview:**

- The application is a simulation platform for energy trading, designed to educate users about market dynamics and test trading strategies.
- Users can select a past date, place bids in the day-ahead market, and see simulated outcomes based on historical prices.
- The application integrates with gridstatus.io for historical data and optionally includes a conversational AI video agent using Tavus for educational purposes.

**Functional Requirements:**

- User dashboard to select a past date for simulation.
- Display historical day-ahead prices (hourly) and real-time prices (5-minute intervals) for the selected date.
- Allow users to place up to 10 buy or sell bids per hour for each of the 24 hours of the selected date, each bid with a price ($/MWh) and quantity (MWh).
- Simulate bid execution based on historical day-ahead prices:
  - Buy bids with price ≥ P_DA are executed at P_DA.
  - Sell bids with price ≤ P_DA are executed at P_DA.
- For each executed bid, calculate profit or loss by offsetting the position in the real-time market:
  - For a long position (buy): Profit = (average of P_RT over the hour - P_DA) * quantity
  - For a short position (sell): Profit = (P_DA - average of P_RT over the hour) * quantity
- Provide visualizations of:
  - Day-ahead and real-time price trends for the selected date.
  - User's total profit/loss for the day and per hour.
- Include a form where users can input their bids for each hour and see the simulated results.
- Handle cases where historical data is unavailable for the selected date by displaying an appropriate message.

**Technical Specifications:**

- Frontend: Use React with Arco Design for UI components.
- Backend: Use FastAPI for API endpoints and simulation logic.
- Data Integration: Integrate with the gridstatus.io API to fetch historical day-ahead and real-time prices for the CAISO market. Use environment variables (via a .env file) to store the gridstatus.io API key securely.
- Deployment: Deploy the application on Bolt.new, ensuring it includes the 'Built on Bolt' badge.
- Optional Feature: If time permits, integrate Tavus to add a conversational AI video agent that can provide educational content or market insights. Use Tavus's React SDK for this integration.
- Data Storage: Use in-memory storage or SQLite for storing bids and simulation results during a session. No persistent user accounts or authentication are required.
- Error Handling: Ensure the application handles API errors gracefully, such as when data is unavailable for certain dates.

**Design and User Experience:**

- The application should have a clean, professional design with an energy-themed color scheme (e.g., blues and greens).
- Use responsive design principles to ensure it works well on different devices.
- Visualizations should be clear and informative, using libraries like Chart.js or Recharts.
- The user interface should be intuitive, with clear navigation between the dashboard, bid placement form, and results.

**Additional Features:**

- If time permits, add a conversational AI video agent using Tavus to explain energy market concepts or provide insights into simulated data. This agent should be accessible via a chat interface or a dedicated section on the dashboard.

**Deployment and Submission:**

- Ensure the application is publicly accessible via a URL deployed on Bolt.new.
- Include the 'Built on Bolt' badge on the deployed application.
- Prepare a demonstration video (<3 minutes) showcasing the application's features and functionality.
- Provide a text description of the project for the Bolt hackathon submission.
- Note: This project is eligible for the Conversational AI Video Challenge if Tavus is integrated.

**Important Notes:**

- The application must be built primarily with Bolt.new, as per the hackathon rules.
- Use Bolt's 'Enhance prompt' feature if available to refine this prompt before submitting it to Bolt.new.
- Ensure the code is well-structured, readable, and follows best practices for React, Arco Design, and FastAPI.
- The application should be functional and ready for submission by June 30, 2025, at 4:00 PM CDT.

**Technical Details:**

- Use the gridstatusio Python client to fetch data from gridstatus.io. Handle API rate limits by caching data locally if necessary.
- For visualizations, use Chart.js or Recharts to create line charts for price trends and bar charts for profit/loss.
- Ensure the application can handle multiple hours of data (24 hours) and calculate profits/losses for each hour separately.
- If integrating Tavus, use their React SDK to set up a conversational video interface with pre-defined interactions (e.g., FAQs about energy markets).

**Final Note:**
This is a zero-shot prompt, so no examples are provided. The application should be built from scratch based on the detailed specifications above. Ensure that all functional and technical requirements are met, and the application is ready for deployment and hackathon submission.
