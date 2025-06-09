# Virtual Energy Trader Project Plan

## 1. Introduction

The "Virtual Energy Trader" is a web-based simulation platform designed to emulate energy trading in day-ahead and real-time markets, developed as part of your application for a software engineering role at CVector and for submission to the Bolt hackathon. This document outlines the project’s requirements, technical design, development plan, and compliance with hackathon rules, ensuring alignment with CVector’s mission to provide real-time insights for energy projects and the Bolt hackathon’s focus on innovative applications built with [Bolt.new](https://bolt.new/).

## 2. Project Objectives

- **CVector Goals:**
  - Demonstrate proficiency in software development, including frontend (React, Arco Design) and backend (FastAPI) skills.
  - Show understanding of energy trading concepts, aligning with CVector’s focus on energy data management.
  - Deliver a high-quality, functional application that could integrate with CVector’s platform.
- **Bolt Hackathon Goals:**
  - Build a new application primarily using [Bolt.new](https://bolt.new/), meeting the hackathon’s submission deadline of June 30, 2025.
  - Include the "Built on Bolt" badge in the deployed application.
  - Provide a publicly accessible URL and a demonstration video (<3 minutes) for judging.

## 3. Functional Requirements

The application simulates a virtual energy trader participating in two markets:

- **Day-Ahead Market:**
  - Users can place up to 10 bids (buy or sell) per hour for a selected date.
  - Each bid includes a price ($/MWh) and quantity (MWh).
  - Bids are submitted before a simulated 11 am deadline.
  - The system uses historical day-ahead prices (P_DA) from [gridstatus.io](https://www.gridstatus.io/api) as the clearing price:
    - Buy bids with price ≥ P_DA are executed at P_DA.
    - Sell bids with price ≤ P_DA are executed at P_DA.
- **Real-Time Market:**
  - For each executed day-ahead position, the system offsets the position using real-time prices (P_RT) at 5-minute intervals.
  - Profit/loss calculation:
    - For a long position (buy in day-ahead): Profit = (average P_RT - P_DA) * quantity.
    - For a short position (sell in day-ahead): Profit = (P_DA - average P_RT) * quantity.
- **User Interface:**
  - **Dashboard:** Displays historical market data (day-ahead and real-time prices, load) and trader’s portfolio (active positions, profit/loss).
  - **Bid Placement Form:** Allows users to input bids with type (buy/sell), price, and quantity.
  - **Visualizations:** Charts showing price trends and trading performance (e.g., profit/loss over time).
- **Simulation Mode:**
  - Users select a past date for simulation.
  - The system fetches historical data for that date and simulates trading outcomes.

## 4. Technical Requirements

### 4.1 Tech Stack

| Component       | Technology                     | Purpose                                      |
|-----------------|-------------------------------|----------------------------------------------|
| Frontend        | React, Arco Design            | User interface, dashboards, visualizations   |
| Backend         | FastAPI (Python)              | API endpoints, simulation logic             |
| Data Source     | gridstatus.io API             | Historical and real-time energy market data |
| Deployment      | Bolt.new                      | Development and hosting platform            |
| Data Storage    | In-memory or SQLite           | Store bids and transaction history          |

### 4.2 API Integration

- **gridstatus.io API:**
  - Use the [gridstatusio Python client](https://github.com/gridstatus/gridstatusio) to fetch historical day-ahead and real-time prices for the CAISO market.
  - Obtain an API key from [gridstatus.io](https://www.gridstatus.io/api).
  - Handle rate limits (e.g., 1 million rows/month on the free plan) by caching data locally.
- **Data Types:**
  - Day-ahead prices (hourly).
  - Real-time prices (5-minute intervals).
  - Load data (optional, for context).

### 4.3 Deployment

- Develop and deploy the application using [Bolt.new](https://bolt.new/).
- Ensure the deployed application includes the "Built on Bolt" badge.
- Provide a publicly accessible URL for hackathon judging.

## 5. Project Structure

### 5.1 Frontend (React with Arco Design)

- **Components:**
  - **Dashboard:**
    - Displays market data (prices, load) for a selected date.
    - Shows trader’s portfolio and profit/loss summary.
  - **Bid Placement Form:**
    - Form to input up to 10 bids per hour (type, price, quantity).
    - Validates inputs (e.g., max 10 bids, positive quantities).
  - **Visualizations:**
    - Charts for day-ahead and real-time price trends.
    - Profit/loss chart for trading performance.
    - Use [Chart.js](https://www.chartjs.org/) or [Recharts](https://recharts.org/) for rendering.
- **Features:**
  - Date picker for selecting simulation date.
  - Real-time updates for market data (simulated for historical data).
  - Responsive design using Arco Design components.

### 5.2 Backend (FastAPI)

- **API Endpoints:**
  - `GET /data/day-ahead`: Fetch historical day-ahead prices for a given date and ISO.
  - `GET /data/real-time`: Fetch historical real-time prices for a given date and hour.
  - `POST /bids`: Submit user bids for the day-ahead market.
  - `POST /simulate`: Run the simulation and return results (executed bids, profit/loss).
- **Simulation Logic:**
  - For each hour of the selected date:
    - Fetch P_DA from historical data.
    - Execute bids:
      - Buy: price ≥ P_DA.
      - Sell: price ≤ P_DA.
    - For each executed bid:
      - Fetch P_RT for the hour (12 intervals of 5 minutes).
      - Calculate profit/loss using the formulas above.
  - Aggregate results across all hours.
- **Data Handling:**
  - Cache API responses to avoid rate limits.
  - Store bids and results in-memory or SQLite.

### 5.3 Data Storage

- Use in-memory storage for bids and transaction history during simulation.
- Optionally, use SQLite for persistence if needed for testing.

## 6. Development Plan

### 6.1 Setup and Environment

- **API Key:** Sign up for a free API key at [gridstatus.io](https://www.gridstatus.io/api).
- **Bolt.new Project:**
  - Initialize a new project in [Bolt.new](https://bolt.new/).
  - Select React with Arco Design for frontend and FastAPI for backend.
- **Dependencies:**
  - Frontend: React, Arco Design, Chart.js/Recharts.
  - Backend: FastAPI, gridstatusio, SQLite (optional).

### 6.2 Data Integration

- **Fetch Data:**
  - Use gridstatusio to retrieve CAISO historical data.
  - Test API calls for day-ahead and real-time prices.
- **Rate Limits:**
  - Implement caching to stay within the 1 million rows/month limit.
  - Add delays between requests if needed.

### 6.3 Frontend Development

- **Dashboard:**
  - Build a layout with market data and portfolio sections.
  - Integrate date picker for simulation.
- **Bid Placement:**
  - Create a form with input validation.
  - Send bids to the backend via API.
- **Visualizations:**
  - Render price and profit/loss charts.
  - Ensure charts are interactive and responsive.

### 6.4 Backend Development

- **API Endpoints:**
  - Implement data fetching and simulation endpoints.
  - Ensure secure handling of API keys.
- **Simulation Logic:**
  - Code the market clearing and profit calculation logic.
  - Validate results with sample data.
- **Error Handling:**
  - Handle API errors, data unavailability, and invalid inputs.

### 6.5 Testing

- **Unit Testing:**
  - Test API endpoints with mock data.
  - Verify simulation logic with known inputs.
- **Integration Testing:**
  - Ensure frontend and backend communicate correctly.
- **Simulation Testing:**
  - Run simulations for sample dates and verify profit/loss.

### 6.6 Deployment and Submission

- **Deploy to Bolt.new:**
  - Deploy the application and verify the public URL.
  - Add the "Built on Bolt" badge.
- **Hackathon Submission:**
  - Write a text description of the project’s features.
  - Record a <3-minute video demonstrating the application.
  - Submit to [worldslargesthackathon.devpost.com](https://worldslargesthackathon.devpost.com/) by June 30, 2025.

## 7. Bolt Hackathon Compliance

- **Primary Development:** Build the core application in [Bolt.new](https://bolt.new/).
- **Badge:** Include the "Built on Bolt" badge in the deployed interface.
- **Submission Requirements:**
  - Provide a public URL for the application.
  - Submit a text description and demonstration video.
  - Confirm usage of Bolt.new in the submission form.
- **Optional Challenges:**
  - Consider the "Creative Use of AI" bonus by adding an LLM to analyze market trends (if time permits).

## 8. Additional Features (Optional)

- **Live Data Mode:** Extend the app to use real-time data from [gridstatus.io](https://www.gridstatus.io/api) for live trading simulations.
- **Price Spike Analysis:** Implement Joshua’s alternative idea to identify price spikes in historical data and use an LLM for explanations.
- **Advanced Visualizations:** Add more charts, like volatility or bid success rates.

## 9. Deliverables

- **Source Code:** GitHub repository with React frontend and FastAPI backend.
- **Deployed Application:** Public URL hosted on [Bolt.new](https://bolt.new/).
- **Documentation:**
  - README with setup, usage, and API key instructions.
  - Notes on development decisions and challenges.
- **Hackathon Submission:**
  - Text description of features and functionality.
  - Demonstration video (<3 minutes).
- **CVector Submission:**
  - Share the GitHub repository and deployed URL with Joshua Napoli.
  - Schedule a follow-up call if needed ([Clockwise link](https://www.getclockwise.com/c/jnapoli-cvector-energy/consultation-take-home-test)).

## 10. Timeline

| Task                     | Duration       | Deadline         |
|--------------------------|----------------|------------------|
| Setup and API key        | 1 day          | June 7, 2025     |
| Data integration         | 2 days         | June 9, 2025     |
| Frontend development     | 3 days         | June 12, 2025    |
| Backend development      | 3 days         | June 15, 2025    |
| Testing                  | 2 days         | June 17, 2025    |
| Deployment and submission| 2 days         | June 19, 2025    |

*Note:* This timeline assumes completion by June 19, 2025, to allow buffer time before the hackathon deadline.

## 11. Risks and Mitigations

| Risk                              | Mitigation                                      |
|-----------------------------------|------------------------------------------------|
| API rate limits                   | Cache data locally, limit API calls            |
| Data unavailability               | Use fallback sample data for testing           |
| Bolt.new limitations              | Use external editor for complex tasks, deploy via Bolt.new |
| Simulation accuracy               | Validate logic with historical data            |

## 12. Conclusion

The "Virtual Energy Trader" will showcase your ability to build a data-driven, full-stack application that aligns with CVector’s energy data platform and meets the Bolt hackathon’s requirements. By integrating real-world energy data and providing an intuitive interface, the project demonstrates both technical expertise and domain relevance. Completing it by June 19, 2025, ensures ample time for testing and submission.
