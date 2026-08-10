import Foundation
import PDFKit

func extractPDF(inputPath: String, outputPath: String) {
    let url = URL(fileURLWithPath: inputPath)
    guard let pdf = PDFDocument(url: url) else {
        print("Failed to load \(inputPath)")
        return
    }
    var fullText = ""
    for i in 0..<pdf.pageCount {
        if let page = pdf.page(at: i), let pageText = page.string {
            fullText += "=== PAGE \(i + 1) ===\n" + pageText + "\n\n"
        }
    }
    try? fullText.write(toFile: outputPath, atomically: true, encoding: .utf8)
    print("Extracted \(pdf.pageCount) pages from \(inputPath) -> \(outputPath) (\(fullText.count) chars)")
}

extractPDF(inputPath: "/Users/asus/Desktop/task/Zignuts_Task4_PRD_CRM_AI_Analytics.pdf", outputPath: "/Users/asus/Desktop/task/prd1.txt")
extractPDF(inputPath: "/Users/asus/Desktop/task/Zignuts_Candidate_Task4_CRM_AI_Analytics.pdf", outputPath: "/Users/asus/Desktop/task/prd2.txt")
