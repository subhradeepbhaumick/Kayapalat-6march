"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import jsPDF from "jspdf";
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DisplayAgreementModal({ isOpen, onClose }: Props) {
  const [spaces, setSpaces] = useState<any[]>([]);
  const { data: session } = useSession();
  const [signature, setSignature] = useState<File | null>(null);
  const [kayapalatSignature, setKayapalatSignature] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const dealerId = session?.user?.id;
  const [formData, setFormData] = useState({
    brandName: "",
    address: "",
    spaceLocation: "",
    area: "",
    placement: "",
    spaceType: "",
    displayFee: "",
    duration: "",
    expireDate: "",
    bookingDate: "",
    kayapalatName: "",
    kayapalatDesignation: "",
    brandPersonName: "",
    brandDesignation: "",
    signature: "",
  });
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSignature(file);

    // ✅ Convert to base64 for PDF
    const reader = new FileReader();
    reader.onloadend = () => {
      setSignaturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  const [contract, setContract] = useState("");
  const getCurrentDateDB = () => {
    const now = new Date();

    return now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    }); // yyyy-mm-dd
  };
  const getTerminationDateDB = () => {
    const now = new Date();
    const durationMonths = Number(formData.duration || 0);

    const futureDate = new Date(
      now.getFullYear(),
      now.getMonth() + durationMonths,
      now.getDate()
    );

    return futureDate.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    }); // yyyy-mm-dd
  };
  // ✅ Fetch spaces from DB
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await fetch("/api/businessBrand/spaces");
        const data = await res.json();
        setSpaces(data);
      } catch (err) {
        console.error("Error fetching spaces:", err);
      }
    };

    fetchSpaces();
  }, []);
  useEffect(() => {
    const loadKayapalatSignature = async () => {
      const res = await fetch("/signature-stamp-kayapalat.jpeg");
      const blob = await res.blob();

      const reader = new FileReader();
      reader.onloadend = () => {
        setKayapalatSignature(reader.result as string);
      };

      reader.readAsDataURL(blob);
    };

    loadKayapalatSignature();
  }, []);
  const generatePDF = (signatureBase64: string) => {
    const doc = new jsPDF("p", "mm", "a4");

    const marginLeft = 15;
    let y = 25; // Increased top margin for header

    // 🎨 DECORATIVE HEADER
    doc.setFillColor(240, 240, 240);
    doc.rect(10, 10, 190, 12, "F");

    doc.setFont("Times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(50, 50, 50);

    const headerText = "DISPLAY AGREEMENT";
    const headerSplit = doc.splitTextToSize(headerText, 180);
    headerSplit.forEach((line: string, index: number) => {
      doc.text(line, 105, 18 + index * 5, { align: "center" });
    });

    // Header underline
    doc.setLineWidth(1.5);
    doc.setDrawColor(100, 100, 100);
    const centerX = 105; // center of A4 page
    const lineWidth = 120; // adjust length as needed

    doc.line(centerX - lineWidth / 2, 20, centerX + lineWidth / 2, 20);

    // // 🎨 COURT-STYLE CONTENT BORDER
    // doc.setLineWidth(0.5);
    // doc.setDrawColor(120, 120, 120);
    // doc.rect(12, 28, 186, 240, 'S'); // Main content frame

    y = 35; // Content starts inside border

    const pageHeight = 280;

    const addLine = (text: string, size = 10, bold = false) => {
      doc.setFont("Times", bold ? "bold" : "normal");
      doc.setFontSize(size);

      const split = doc.splitTextToSize(text, 180);

      split.forEach((line: string) => {
        if (y > pageHeight) {
          doc.addPage();
          y = 25; // Match header spacing on new pages
        }
        doc.text(line, marginLeft, y);
        y += 8; // Increased spacing for legal document look
      });
    };

    const addGap = (gap = 5) => {
      if (y + gap > pageHeight) {
        doc.addPage();
        y = 25;
      } else {
        y += gap;
      }
    };

    // 🎨 Horizontal ruling line between sections
    const addRulingLine = () => {
      doc.setLineWidth(0.3);
      doc.setDrawColor(150, 150, 150);
      doc.line(marginLeft, y + 2, marginLeft + 170, y + 2);
      y += 6;
    };

    // ✅ TITLE HEADER
    addLine(
      `This is a professional Display Unit / Branding Agreement between John Management Pvt Ltd(Brandname: KAYAPALAT) & ${formData.brandName} (Manufacturer / Brand/ Dealer).`,
      10
    );

    addLine("DISPLAY UNIT / BRANDING AGREEMENT", 14, true);
    addGap(2);

    const getCurrentDateIST = () => {
      const now = new Date();

      return now.toLocaleDateString("en-GB", {
        timeZone: "Asia/Kolkata",
      }); // dd/mm/yyyy
    };

    addLine(`This Agreement is made on ${getCurrentDateIST()}`, 10, true);

    addLine("BETWEEN", 11, true);

    addLine(
      "Kayapalat , a company incorporated under the Companies Act, 2013, having its registered office at “Kayapalat Interior Studio”-1160 Chadpur Poleghat, Mouza 80 P.O.- Malancha, P.S.- Sonarpur, Kolkata- 700145, India."
    );

    addLine("(hereinafter referred to as the “Retail Mediator”)");

    addLine("AND", 11, true);

    addLine(
      `${formData.brandName} [Manufacturer / Brand/Dealer], having its registered office at ${formData.address}`
    );

    addLine("(hereinafter referred to as the “Brand / Manufacturer/ Dealer”)");

    addLine(
      "Retailer and Manufacturer are individually referred to as a “Party” and collectively as the “Parties”."
    );

    // ✅ ENHANCED SECTION FUNCTION
    const section = (title: string) => {
      // ✅ Check before printing section
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 25;
      }

      y += 6;

      doc.setFont("Times", "bold");
      doc.setFontSize(14);

      doc.text(title, marginLeft, y);

      y += 8;
    };

    // 1
    section("1. PURPOSE");
    addLine(
      "The Retail Mediator permits the Manufacturer/Brand/Dealer to install and maintain branded display units, fixtures, signage, or visual merchandising materials (“Display Units”) at the Kayapalat Interior Studio for promotion and sale of the Manufacturer’s products."
    );
    // 2
    section("2. LOCATION & SPACE");
    addLine(`• Space location: ${formData.spaceLocation}`);
    addLine(`• Area allotted: ${formData.area} sq. ft. (approx.)`);
    addLine(`• Placement: ${formData.placement}`);
    addLine("• Space allocation is non-exclusive.");

    // 3
    section("3. OWNERSHIP OF DISPLAY UNITS");
    addLine(
      "• All Display Units remain the sole property of the Manufacturer/Dealer/Brand."
    );
    addLine("• Retail Mediator shall not acquire any ownership rights.");
    addLine("• Display Units must be removed upon termination.");
    // addGap(38);
    // 4
    section("4. INSTALLATION & MAINTENANCE");
    addLine("• Installation cost: Manufacturer/Brand/Dealer");
    addLine("• Maintenance & upkeep: Manufacturer/Brand/Dealer");
    addLine("• Display Units must comply with:");
    addLine("o KAYAPALAT design guidelines");
    addLine("o Safety and fire regulations");
    addLine(
      "• Any damage to store property shall be repaired at Manufacturer/Brand/Dealer’s cost."
    );

    // 5
    section("5. BRANDING & VISUAL MERCHANDISING");
    addLine("• Branding content must be approved by the KAYAPALAT.");
    addLine("• No offensive, misleading, or non-compliant material allowed.");
    addLine(
      "• KAYAPALAT reserves the right to remove or modify branding if it affects store aesthetics or policy."
    );

    // 6
    section("6. COMMERCIAL TERMS");
    addLine(`Space Type: ${formData.spaceType}`);
    addLine(" Fixed Display Fee");
    addLine(`• Display fee: Rs. ${formData.displayFee} per month`);
    addLine("• GST applicable as per law");

    // 7
    section("7. TERM & TERMINATION");
    addLine(`• Agreement term: ${formData.duration} months`);
    const getTerminationDate = () => {
      const now = new Date();

      const durationMonths = Number(formData.duration || 0);

      const futureDate = new Date(
        now.getFullYear(),
        now.getMonth() + durationMonths,
        now.getDate()
      );

      return futureDate.toLocaleDateString("en-GB", {
        timeZone: "Asia/Kolkata",
      }); // dd/mm/yyyy
    };

    addLine(`• Termination Date: ${getTerminationDate()}`);
    addLine("• Either Party may terminate with 30 days’ written notice.");
    addLine("• Immediate termination if:");
    addLine("o Brand guidelines are violated");
    addLine("o Legal or safety non-compliance");
    addLine("o Non-payment of agreed fees");
    // 8
    section("8. INSURANCE & RISK");
    addLine("• Manufacturer/Brand/Dealer shall insure Display Units.");
    addLine(
      "• KAYAPALAT not responsible for theft, damage, or wear and tear unless caused by negligence."
    );

    // 9
    section("9. COMPLIANCE");
    addLine("Manufacturer/Brand/Dealer shall comply with:");
    addLine("• Legal Metrology Act (MRP, labeling)");
    addLine("• Consumer protection laws");
    addLine("• GST and tax regulations");
    addLine("• KAYAPALAT operational policies");

    // 10
    section("10. INTELLECTUAL PROPERTY");
    addLine(
      "• Trademarks, logos, and brand assets remain Manufacturer’s property."
    );
    addLine("• No transfer of IP rights under this Agreement.");

    // 11
    section("11. INDEMNITY");
    addLine("Manufacturer/Brand/Dealer shall indemnify KAYAPALAT against:");
    addLine("• Product liability claims");
    addLine("• IP infringement claims");
    addLine("• Injury or damage caused by Display Units");
    // 12
    section("12. CONFIDENTIALITY");
    addLine(
      "Commercial terms and business information shall remain confidential during and after termination."
    );

    // 13
    section("13. Rules & Regulations");
    addLine(
      `If ${formData.brandName} fails to pay the contractual payable amount to Kayapalat or doesn’t want to continue the deal with Kayapalat before the contract termination date, Kayapalat shall have the right to withhold release of the products until full payment of all dues is received.`
    );
    addLine(
      "This agreement shall have a minimum tenure of six (6) months from the effective deal date, and cannot be terminated before the completion of this period."
    );
    // 14
    section("14. GOVERNING LAW & JURISDICTION");
    addLine("This Agreement shall be governed by the laws of India.");
    addLine("Courts at Kolkata shall have exclusive jurisdiction.");
    // 15
    section("15. SIGNATURES");

    addGap(5);

    addLine("KAYAPALAT", 11, true);
    addLine("Name: John Bor");
    addLine("Designation: CEO");
    //   addLine("Signature: __________________");

    addGap(5);

    addLine(`${formData.brandName} [Manufacturer / Brand /Dealer]`, 11, true);
    addLine(`Name: ${formData.brandPersonName}`);
    addLine(`Designation: ${formData.brandDesignation}`);
    //   addLine("Signature: __________________");
    addGap(5);

    const leftX = marginLeft;
    const rightX = 110;

    const imageWidth = 50;
    const imageHeight = 50;

    // Calculate centers
    const leftCenter = leftX + imageWidth / 2;
    const rightCenter = rightX + imageWidth / 2;

    // ================= COMPANY NAMES (TOP) =================
    doc.setFont("Times", "bold");
    doc.setFontSize(11);

    doc.text("John Management Pvt Ltd", leftCenter, y, { align: "center" });
    doc.text(formData.brandName, rightCenter, y, { align: "center" });

    y += 8;

    // ================= SIGNATURE IMAGES =================
    if (kayapalatSignature) {
      doc.addImage(
        kayapalatSignature,
        "JPEG",
        leftX,
        y,
        imageWidth,
        imageHeight
      );
    }

    if (signatureBase64) {
      doc.addImage(signatureBase64, "JPEG", rightX, y, imageWidth, imageHeight);
    }

    y += imageHeight + 10;

    // ================= DESIGNATION (BOTTOM) =================
    doc.setFont("Times", "bold");
    doc.setFontSize(10);

    doc.text("Director", leftCenter, y, { align: "center" });
    doc.text("Proprietor/Director/Partner", rightCenter, y, {
      align: "center",
    });
    // ✅ SAVE
    const fileName = `Display_Agreement_${formData.spaceType || ""}.pdf`;
    doc.save(fileName);
  };

  // ✅ Handle dropdown + autofill
  const handleSpaceChange = (e: any) => {
    const selectedSpaceType = e.target.value;

    const selectedSpace = spaces.find(
      (s) => s.space_type === selectedSpaceType
    );

    if (!selectedSpace) return;

    // 🚫 BLOCK IF NOT OWNER
    if (
      selectedSpace.dealer_id &&
      selectedSpace.dealer_id.toString() !== dealerId?.toString()
    ) {
      alert(
        "This Space is purchased by other Brand. Kindly Contact to KAYAPALAT to discuss"
      );
      return;
    }

    // ✅ ALLOW
    setFormData((prev) => ({
      ...prev,
      spaceLocation: selectedSpace.space_type,
      area: selectedSpace.size,
      spaceType: selectedSpace.space_type,
      displayFee: selectedSpace.price,
      duration: selectedSpace.time_period || "",
      expireDate: selectedSpace.expire_date || "",
      bookingDate: selectedSpace.booking_date || "",
    }));
  };
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN"); // dd/mm/yyyy
  };
  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!signature) {
      alert("Signature upload is mandatory");
      return;
    }
    // ✅ ADD THIS CHECK HERE
    if (!signaturePreview) {
      alert("Signature still processing. Please wait 1–2 seconds.");
      return;
    }
    try {
      const formDataToSend = new FormData();

      formDataToSend.append("file", signature);
      formDataToSend.append("dealer_id", dealerId || "");
      formDataToSend.append("space_type", formData.spaceType);

      const res = await fetch("/api/generate-agreement/signature-upload", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      // ✅ Save signature for PDF
      const signatureBase64 = signaturePreview;

      setFormData((prev) => ({
        ...prev,
        signature: signatureBase64,
      }));

      // ================================
      // ✅ GENERATE DB DATES
      // ================================
      const bookingDateDB = getCurrentDateDB(); // yyyy-mm-dd
      const expireDateDB = getTerminationDateDB(); // yyyy-mm-dd

      // ================================
      // ✅ CALL PUT API TO UPDATE DB
      // ================================
      await fetch("/api/businessBrand/spaces", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          space_type: formData.spaceType,
          booking_date: bookingDateDB,
          expire_date: expireDateDB,
        }),
      });

      // ================================
      // ✅ GENERATE PDF
      // ================================
      generatePDF(signatureBase64);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Display Agreement</h2>
          <button
            onClick={onClose}
            className="text-lg px-2 py-1 rounded hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        {!contract && (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
          >
            {/* Brand Name */}
            <div className="col-span-1">
              <label className="text-sm font-medium">Brand Name</label>
              <input
                name="brandName"
                placeholder="Enter Brand Name"
                onChange={handleChange}
                required
                className="border p-2 w-full text-sm sm:text-base"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-sm font-medium">Brand Address</label>
              <input
                name="address"
                placeholder="Enter Address"
                onChange={handleChange}
                required
                className="border p-2 w-full text-sm sm:text-base"
              />
            </div>

            {/* Space Location */}
            <div>
              <label className="text-sm font-medium">Space Location</label>
              <select
                name="spaceLocation"
                onChange={handleSpaceChange}
                className="border p-2 w-full text-sm sm:text-base"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Select Space Location
                </option>

                {spaces
                  .filter(
                    (space: any) =>
                      space.dealer_id?.toString() === dealerId?.toString() &&
                      space.booking_status === "pending"
                  )
                  .map((space: any) => (
                    <option key={space.space_type} value={space.space_type}>
                      {space.space_type}
                    </option>
                  ))}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="text-sm font-medium">Area (sqft)</label>
              <input
                name="area"
                value={formData.area}
                disabled
                className="border p-2 w-full bg-gray-100 text-sm"
              />
            </div>

            {/* Placement */}
            <div>
              <label className="text-sm font-medium">Placement</label>
              <input
                name="placement"
                placeholder="Wall / Kiosk / Counter"
                onChange={handleChange}
                className="border p-2 w-full text-sm"
                required
              />
            </div>

            {/* Space Type */}
            <div>
              <label className="text-sm font-medium">Space Type</label>
              <input
                name="spaceType"
                value={formData.spaceType}
                disabled
                className="border p-2 w-full text-sm bg-gray-100"
              />
            </div>

            {/* Display Fee */}
            <div>
              <label className="text-sm font-medium">
                Display Fee (Rs./month)
              </label>
              <input
                name="displayFee"
                value={formData.displayFee}
                disabled
                className="border p-2 w-full bg-gray-100 text-sm"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium">Duration</label>
              <input
                name="duration"
                value={formData.duration ? `${formData.duration} Months` : ""}
                disabled
                className="border p-2 w-full bg-gray-100 text-sm"
              />
            </div>

            {/* Brand Person */}
            <div>
              <label className="text-sm font-medium">
                Brand Representative Name
              </label>
              <input
                name="brandPersonName"
                placeholder="Enter Name"
                onChange={handleChange}
                className="border p-2 w-full text-sm"
                required
              />
            </div>

            {/* Designation */}
            <div>
              <label className="text-sm font-medium">Designation</label>
              <input
                name="brandDesignation"
                placeholder="Enter Designation"
                onChange={handleChange}
                className="border p-2 w-full text-sm"
                required
              />
            </div>

            {/* Signature Upload */}
            <div className="col-span-1 sm:col-span-2">
              <label className="text-sm font-semibold">
                Signature Upload <span className="text-red-500">*</span>
              </label>

              <p className="text-xs text-gray-500 mb-2">
                Upload clear signature with stamp
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 text-center hover:border-green-500 bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  required
                  className="hidden"
                  id="signatureUpload"
                />

                <label
                  htmlFor="signatureUpload"
                  className="cursor-pointer block"
                >
                  {!signature ? (
                    <div>
                      <p className="text-gray-600 text-sm">Tap to upload</p>
                      <p className="text-xs text-gray-400">
                        PNG / JPG /JPEG (Max 5MB)
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="border bg-white p-2 w-[150px] h-[80px] sm:w-[200px] sm:h-[100px] flex items-center justify-center">
                        {signaturePreview && (
                          <img
                            src={signaturePreview}
                            alt="Signature Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        )}
                      </div>

                      <p className="text-xs text-green-600">{signature.name}</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={!signaturePreview}
              className={`col-span-1 sm:col-span-2 p-3 rounded text-white text-sm sm:text-base ${
                !signaturePreview
                  ? "bg-gray-400"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {signaturePreview
                ? "Generate Agreement"
                : "Processing Signature..."}
            </button>
          </form>
        )}

        {/* RESULT */}
        {contract && (
          <div>
            <pre className="whitespace-pre-wrap text-xs sm:text-sm">
              {contract}
            </pre>

            <button
              onClick={() => setContract("")}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto"
            >
              Edit Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
