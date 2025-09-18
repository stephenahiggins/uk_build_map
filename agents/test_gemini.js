import { analyseEvidenceWithGemini, getProjectStatusWithGemini } from "./src/geminiService.js";

// Simple test to verify Gemini integration
async function testGemini() {
  console.log("🧪 Testing Gemini Integration...");

  try {
    // Test with minimal data
    const testEvidence = [
      {
        timestamp: new Date().toISOString(),
        sourceUrl: "https://test.gov.uk/announcement",
        summary: "Test announcement",
        sentiment: "Neutral",
        rawText: "This is a test announcement for infrastructure development.",
      },
    ];

    console.log("Testing evidence analysis...");
    const analysis = await analyseEvidenceWithGemini(testEvidence);
    console.log("✅ Analysis successful:", analysis);

    const testProject = {
      id: "test-project",
      authority: "Test Authority",
      name: "Test Project",
      description: "A test project for verification",
      status: "Green",
      evidence: testEvidence,
      lastUpdated: new Date().toISOString(),
    };

    console.log("Testing project status determination...");
    const status = await getProjectStatusWithGemini(testProject);
    console.log("✅ Status determination successful:", status);

    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testGemini();
