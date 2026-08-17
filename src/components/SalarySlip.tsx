"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
async function loadImage(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
}
export async function generateSalarySlip(
    empId: string,
    month: number,
    year: number
) {
    try {
        const res = await fetch(
            `/api/employees/attendance/salary-slip?emp_id=${empId}&month=${month}&year=${year}`
        );

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Unable to generate salary slip.");
            return;
        }

        const { company, employee, attendance, salary } = data;

        const doc = new jsPDF("p", "mm", "a4");

        const pageWidth = doc.internal.pageSize.getWidth();

        //---------------------------------------
        // HEADER
        //---------------------------------------

        doc.setFillColor(41, 90, 71);
        doc.rect(0, 0, pageWidth, 28, "F");

        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text(company.name, pageWidth / 2, 12, {
            align: "center",
        });

        doc.setFontSize(10);
        doc.text(company.address, pageWidth / 2, 18, {
            align: "center",
        });

        doc.text(
            `${company.email} | ${company.phone}`,
            pageWidth / 2,
            23,
            { align: "center" }
        );

        //---------------------------------------
        // TITLE
        //---------------------------------------

        doc.setTextColor(0);

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");

        doc.text(
            `Salary Slip - ${monthNames[month]} ${year}`,
            pageWidth / 2,
            38,
            { align: "center" }
        );

        //---------------------------------------
        // EMPLOYEE DETAILS
        //---------------------------------------

        autoTable(doc, {
            startY: 46,
            theme: "grid",
            head: [["Employee Information", ""]],
            body: [
                ["Employee ID", employee.emp_id],
                ["Employee Name", employee.name],
                ["Email", employee.email],
                ["Designation", employee.designation],
                [
                    "Joining Date",
                    new Date(employee.joining_date).toLocaleDateString(
                        "en-GB"
                    ),
                ],
                [
                    "Monthly Salary",
                    ` ${Number(
                        employee.monthly_salary
                    ).toLocaleString()}`,
                ],
            ],
            headStyles: {
                fillColor: [41, 90, 71],
            },
        });

        //---------------------------------------
        // ATTENDANCE
        //---------------------------------------

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,

            theme: "grid",

            head: [["Attendance Summary", "Value"]],

            body: [
                ["Working Days", attendance.total_days],
                ["Present Days", attendance.present_days],
                ["Half Days", attendance.half_days],
                ["Weekoff Used", attendance.weekoff_days],
                ["Unused Weekoff", attendance.unused_weekoff],
            ],

            headStyles: {
                fillColor: [41, 90, 71],
            },
        });

        //---------------------------------------
        // SALARY DETAILS
        //---------------------------------------

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,

            theme: "grid",

            head: [["Salary Details", "Amount"]],

            body: [
                [
                    "Per Day Salary",
                    ` ${attendance.per_day_income.toLocaleString()}`,
                ],
                [
                    "Monthly Salary",
                    ` ${Number(employee.monthly_salary).toLocaleString()}`,
                ],
                [
                    "Net Pay",
                    ` ${salary.total_salary.toLocaleString()}`,
                ],
                [
                    "Payment Status",
                    salary.payment_status,
                ],
            ],

            headStyles: {
                fillColor: [41, 90, 71],
            },

            bodyStyles: {
                fontSize: 11,
            },
        });
        const signature = await loadImage("/signature-stamp-kayapalat.jpeg");
        //---------------------------------------
        // FOOTER
        //---------------------------------------
        let y = (doc as any).lastAutoTable.finalY + 18;
        doc.setFontSize(10);
        doc.text(
            "This is a computer generated salary slip.",
            14,
            y
        );
        y += 10;

        // Signature image
        doc.addImage(
            signature,
            "JPEG",
            145,
            y,
            45,
            28
        );

        doc.setFont("helvetica", "bold");

        doc.text(
            "Authorized Signature",
            167,
            y + 35,
            {
                align: "center",
            }
        );

        //---------------------------------------
        // GENERATED DATE
        //---------------------------------------

        doc.setFont("helvetica", "normal");

        doc.text(
            `Generated on : ${new Date().toLocaleDateString(
                "en-GB"
            )}`,
            14,
            286
        );

        //---------------------------------------
        // DOWNLOAD
        //---------------------------------------

        doc.save(
            `SalarySlip_${employee.emp_id}_${monthNames[month]}_${year}.pdf`
        );
    } catch (err) {
        console.error(err);
        alert("Failed to generate salary slip.");
    }
}