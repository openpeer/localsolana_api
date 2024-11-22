// components/Evidence.js
import React from "react";

const Evidence = (props) => {
  const { record, property } = props;
  const edidenceDetails = record.params[property.name];
  console.log("Here", record.params[property.name]);

  if (Object.keys(edidenceDetails).length > 0) {
    return (
      <section class="sc-dmqHEX fGPrHl adminjs_Box">
        <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
          {/* Left Side (1/3 width) */}
          <div style={{ flex: "1 1 33%", maxWidth: "33%" }}>
            <label className="sc-eDDNvR izJNTD adminjs_Label">
              {property.name === "seller_evidence"
                ? "Seller Evidence"
                : "Buyer Evidence"}
            </label>
          </div>

          {/* Right Side (2/3 width) */}
          <div style={{ flex: "2 1 67%", maxWidth: "67%" }}>
            <label className="sc-eDDNvR izJNTD adminjs_Label">User</label>
            <a
              href={`/admin/resources/users/records/${edidenceDetails.user_id}/show`}
              rel="noopener noreferrer"
              style={{ color: "#1d72b8", textDecoration: "underline" }}
            >
              <div>{edidenceDetails.user_id}</div>
            </a>
            <br/>

            <label className="sc-eDDNvR izJNTD adminjs_Label">Comments</label>
            <div>{edidenceDetails.comments}</div>
            <br/>

            <label className="sc-eDDNvR izJNTD adminjs_Label">Created At</label>
            <div>{edidenceDetails.createdAt}</div>
            <br/>

            <label className="sc-eDDNvR izJNTD adminjs_Label">Files</label>
            <div style={{ width: "100%", overflow: "hidden" }}>
                {edidenceDetails.files.map((data, index) => {
                    return (
                    <img
                        key={index} // Always provide a unique key for list items
                        src={data}
                        alt={`Image ${index}`}
                        style={{
                        maxWidth: "100%", // Ensure the image does not exceed the container width
                        maxHeight: "100%", // Ensure the image does not exceed the container height
                        objectFit: "contain", // Scale the image to fit within the container without distorting
                        marginBottom: "10px", // Optional: Add some space between images
                        }}
                    />
                    );
                })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section class="sc-dmqHEX fGPrHl adminjs_Box">
        <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
        <div style={{ flex: "1 1 33%", maxWidth: "33%" }}>
            <label className="sc-eDDNvR izJNTD adminjs_Label">
                {property.name === "seller_evidence"
                ? "Seller Evidence"
                : "Buyer Evidence"}
            </label>
        </div>
        <div style={{ flex: "2 1 67%", maxWidth: "67%" }}>
            No evidence found
        </div>
      </div>
    </section>
  );
};

export default Evidence;
