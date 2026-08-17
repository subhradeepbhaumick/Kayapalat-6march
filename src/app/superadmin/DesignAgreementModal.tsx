"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Agreement {
    id: number;
    client_id: string;
    client_name: string;
    accepted: number;
    accepted_date: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}
const agreementText = `
TERMS AND CONDITIONS
These Terms and Conditions (“Agreement”) govern the relationship between John Management Pvt Ltd (KAYAPALAT) (“Company,” “Designer,” “we,” “our”) and the Client (“you,” “your”) for interior design services.
1. Scope of Services
The Company agrees to provide interior design services which may include:
• Space planning
• Concept development
• Furniture and material selection
• 2D/3D designs and renderings
• Site visits
• Vendor coordination
• Project supervision
• Custom furniture design
• Procurement assistance
The detailed scope shall be defined in the approved quotation/proposal.
2. Client Responsibilities
The Client agrees to:
• Provide accurate project information and measurements
• Give timely approvals and feedback
• Ensure site access during working hours
• Make payments according to agreed schedules
• Obtain building/society permissions where required
Any delays caused by the Client may affect timelines and costs.
3. Design Fees & Payment Terms
Payment Schedule
• 40% advance before project commencement
• 40% during execution
• 15% during execution
• 5% before final handover
All payments must be made as per payment schedule mention clients dash board .
Late Payments
• Work stoppage
• Delay in delivery
• Additional charges or interest of [5%] per month
4. Changes & Revisions
• Minor revisions are included up to [3] rounds.
• Major changes after approval may incur additional charges.
• Changes affecting materials, dimensions, or execution timelines may extend delivery dates.
All changes must be approved in writing.
5. Project Timeline
Estimated timelines are based on:
• Timely approvals
• Material availability
• Vendor schedules
• Site readiness
The Company is not liable for delays caused by:
• Force majeure events
• Supplier delays
• Government restrictions
• Client-related delays
6. Procurement & Materials
• Material colors and finishes may slightly vary from samples or renders.
• Availability of products may change without notice.
• Equivalent alternatives may be suggested if products are discontinued.
The Company is not responsible for manufacturer defects but will assist in warranty claims where applicable.
7. Site Conditions
The Client must ensure:
• Continuous electricity and water supply
• Safe working conditions
• Proper structural readiness
Unexpected civil, plumbing, or electrical issues discovered during execution may require additional charges.
8. Third-Party Contractors
Where third-party vendors or contractors are involved:
• The Company acts only as a coordinator unless otherwise agreed.
• Contractor warranties and liabilities remain with the respective contractor.
9. Ownership of Designs
All drawings, concepts, renders, and design documents remain the intellectual property of the Company until full payment is received.
The Client may not reproduce, share, or commercially use designs without written permission.
10. Cancellation & Termination
Either party may terminate the agreement with written notice.
In case of cancellation:
• Advance payments are non-refundable once work has started.
• Work completed up to the termination date shall be chargeable.
• Procured materials/custom orders cannot be cancelled or refunded.
11. Warranty
The Company may provide a workmanship warranty of [6/12] months from project completion for installation-related issues only.
Warranty does not cover:
• Normal wear and tear
• Water damage
• Misuse or negligence
• Third-party modifications
12. Photography & Portfolio Rights
The Company may photograph completed projects for portfolio, marketing, and social media purposes unless otherwise agreed in writing.
13. Limitation of Liability
The Company’s total liability shall not exceed the amount paid by the Client for the specific service.
The Company is not liable for:
• Indirect or consequential losses
• Delays caused by third parties
• Material shortages or price fluctuations
14. Confidentiality
Both parties agree to keep confidential any proprietary or sensitive project information shared during the engagement.
15. Dispute Resolution
Any disputes shall first be attempted to be resolved amicably.
If unresolved, disputes shall fall under the jurisdiction of courts located in [City, State].
LABOUR, VENDORS & EXECUTION TERMS
1. Use of Vendors and Labour
The Company may engage third-party vendors, contractors, carpenters, electricians, plumbers, painters, fabricators, delivery agencies, and other service providers (“Vendors”) for execution of the project.
2. Vendor Quotations & Pricing
• Vendor pricing is based on current market rates and material availability.
• Prices may vary due to:
o Raw material fluctuations
o Transportation costs
o Tax changes
o Market shortages
3. Labour Availability & Delays
Project timelines are subject to labour availability and site conditions.
The Company shall not be held responsible for delays caused by:
• Labour shortages
• Worker strikes
• Illness or accidents
• Festivals or public holidays
• Government restrictions
• Extreme weather conditions
• Vendor production delays
4. Third-Party Vendor Liability
Where the Client appoints or recommends any third-party vendor/contractor:
• The Company shall not be responsible for:
o Work quality
o Delays
o Damages
o Safety issues
o Warranty claims
5. Site Safety & Working Conditions
The Client shall ensure:
• Safe and accessible work conditions
• Availability of electricity and water
• Permission for labour entry and work timing
• Security clearance from building/society authorities
6. Material Handling & Storage
• Materials delivered to site shall be considered accepted unless damage is reported immediately.
• The Client shall provide safe storage space at site.
• The Company is not responsible for theft, damage, or loss of materials at site after delivery.
7. Damage During Work
Minor damages such as dust, drilling marks, paint touch-ups, or handling marks may occur during execution and are considered part of standard interior work.
8. Labour Conduct
The Company will make reasonable efforts to ensure professional conduct of labour personnel.
9. Warranty on Vendor Work
Warranty for modular units, appliances, fittings, hardware, lights, or branded products shall be subject to the manufacturer/vendor warranty terms.
10. Payment to Vendors
All payments for materials and execution shall be made only to the Company unless otherwise agreed in writing.
11. Force Majeure
The Company shall not be liable for delays or non-performance caused by circumstances beyond reasonable control.
12. Non-Solicitation of Vendors & Labour
The Client agrees not to directly engage, hire, or bypass the Company to work with the Company’s vendors, contractors, or labour teams during the project and for a period of 12 months after completion.
Violation may result in compensation claims or legal action.
`;
const DesignAgreementModal: React.FC<Props> = ({
    isOpen,
    onClose,
}) => {
    const [agreements, setAgreements] = useState<Agreement[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAgreements();
        }
    }, [isOpen]);

    const fetchAgreements = async () => {
        try {
            setLoading(true);

            const res = await fetch(
                "/api/superadmin/design-agreements"
            );

            const data = await res.json();

            if (res.ok) {
                setAgreements(data.agreements || []);
            } else {
                toast.error("Failed to fetch agreements");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch agreements");
        } finally {
            setLoading(false);
        }
    };
    const downloadAgreementPDF = async (
        clientName: string,
        acceptedDate: string
    ) => {
        const doc = new jsPDF("p", "mm", "a4");

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // =========================
        // HEADER
        // =========================

        const drawHeader = () => {
            doc.setFillColor(41, 90, 71);

            doc.rect(0, 0, pageWidth, 24, "F");

            doc.setTextColor(255, 255, 255);

            doc.setFont("helvetica", "bold");

            doc.setFontSize(20);

            doc.text("DESIGN AGREEMENT", 14, 15);

            doc.setFontSize(10);

            doc.text(
                "John Management Pvt Ltd (KAYAPALAT)",
                14,
                21
            );
        };

        const drawFooter = (
            pageNum: number,
            total: number
        ) => {
            doc.setFontSize(9);

            doc.setTextColor(120);

            doc.text(
                `Page ${pageNum} of ${total}`,
                pageWidth - 38,
                pageHeight - 8
            );

            doc.text(
                "John Management Pvt Ltd (KAYAPALAT)",
                14,
                pageHeight - 8
            );
        };

        drawHeader();

        // =========================
        // CLIENT INFO
        // =========================

        doc.setTextColor(0);

        doc.setFont("helvetica", "bold");

        doc.setFontSize(11);

        doc.text("Client Name:", 16, 35);

        doc.setFont("helvetica", "normal");

        doc.text(clientName, 48, 35);

        doc.setFont("helvetica", "bold");

        doc.text("Agreement Date:", 16, 43);

        doc.setFont("helvetica", "normal");

        doc.text(
            new Date(acceptedDate).toLocaleDateString(
                "en-IN"
            ),
            52,
            43
        );

        // =========================
        // AGREEMENT BODY
        // =========================

        const bodyRows = agreementText
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => [line]);

        autoTable(doc, {
            startY: 60,
            body: bodyRows,
            theme: "plain",
            styles: {
                font: "times",
                fontSize: 11,
                cellPadding: 1.5,
                lineColor: [255, 255, 255],
                textColor: [20, 20, 20],
                overflow: "linebreak",
                valign: "top",
            },
            margin: {
                top: 34,
                left: 16,
                right: 16,
                bottom: 30,
            },
            didDrawPage: () => {
                drawHeader();
            },
        });

        let finalY =
            (doc as any).lastAutoTable.finalY + 18;

        // =========================
        // NEW PAGE
        // =========================

        if (finalY > pageHeight - 120) {
            doc.addPage();

            drawHeader();

            finalY = 60;
        }

        // =========================
        // SIGNATURE
        // =========================

        doc.setFont("helvetica", "bold");

        doc.setFontSize(12);

        doc.setTextColor(41, 90, 71);

        doc.text("Accepted By:", 18, finalY);

        doc.text(
            "For John Management Pvt Ltd:",
            118,
            finalY
        );

        finalY += 22;

        doc.setDrawColor(0);

        doc.setLineWidth(0.5);

        doc.line(18, finalY, 85, finalY);

        doc.line(118, finalY, 188, finalY);

        finalY += 6;

        doc.setTextColor(0);

        doc.setFont("helvetica", "normal");

        doc.setFontSize(11);

        doc.text(clientName, 18, finalY);

        doc.text("John Bor", 118, finalY);

        finalY += 5;

        doc.setFont("helvetica", "bold");

        doc.setFontSize(9);

        doc.setTextColor(100);

        doc.text("(Client Name)", 18, finalY);

        doc.text(
            "(Authorized Signatory)",
            118,
            finalY
        );

        finalY += 25;

        // =========================
        // STAMP
        // =========================

        try {
            const img = new Image();

            img.src =
                "/signature-stamp-kayapalat.jpeg";

            await new Promise((resolve) => {
                img.onload = resolve;
            });

            doc.addImage(
                img,
                "JPEG",
                118,
                finalY,
                40,
                40
            );
        } catch (err) {
            console.log(err);
        }

        // =========================
        // FOOTER
        // =========================

        const totalPages = doc.getNumberOfPages();

        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);

            drawFooter(i, totalPages);
        }

        // =========================
        // SAVE
        // =========================

        doc.save(
            `DesignAgreement-${clientName}.pdf`
        );
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden">

                {/* HEADER */}
                <div className="bg-red-500 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                        Design Agreements
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-white text-3xl leading-none hover:opacity-80"
                    >
                        ×
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 max-h-[80vh] overflow-y-auto">

                    {loading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto"></div>

                            <p className="mt-4 text-gray-600">
                                Loading agreements...
                            </p>
                        </div>
                    ) : agreements.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No agreements found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-red-100">
                                        <th className="border border-gray-300 px-4 py-3 text-left">
                                            Client ID
                                        </th>

                                        <th className="border border-gray-300 px-4 py-3 text-left">
                                            Client Name
                                        </th>

                                        <th className="border border-gray-300 px-4 py-3 text-left">
                                            Accepted
                                        </th>

                                        <th className="border border-gray-300 px-4 py-3 text-left">
                                            Accepted Date
                                        </th>

                                        <th className="border border-gray-300 px-4 py-3 text-left">
                                            Agreement View
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {agreements.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="border border-gray-300 px-4 py-3">
                                                {item.client_id}
                                            </td>

                                            <td className="border border-gray-300 px-4 py-3">
                                                {item.client_name}
                                            </td>

                                            <td className="border border-gray-300 px-4 py-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${item.accepted
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {item.accepted
                                                        ? "Accepted"
                                                        : "Not Accepted"}
                                                </span>
                                            </td>

                                            <td className="border border-gray-300 px-4 py-3">
                                                {item.accepted_date
                                                    ? new Date(
                                                        item.accepted_date
                                                    ).toLocaleString("en-IN")
                                                    : "N/A"}
                                            </td>

                                            <td className="border border-gray-300 px-4 py-3">
                                                <button
                                                    onClick={() =>
                                                        downloadAgreementPDF(
                                                            item.client_name,
                                                            item.accepted_date
                                                        )
                                                    }
                                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                                >
                                                    Download PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DesignAgreementModal;