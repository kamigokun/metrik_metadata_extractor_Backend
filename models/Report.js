import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * A single metadata scan of a URL.
 * `metadata` intentionally stays a loose Mixed blob — the shape of what a
 * page exposes (core tags, Open Graph, Twitter Card, assets) varies enough
 * site to site that forcing a rigid sub-schema would mean silently dropping
 * fields real pages actually send.
 */
const ReportSchema = new Schema(
  {
    url: {
      type: String,
      required: [true, "url is required"],
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    metadata: {
      core: {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        keywords: { type: String, default: "" },
        canonical: { type: String, default: "" },
        robots: { type: String, default: "" },
        author: { type: String, default: "" },
        charset: { type: String, default: "" },
        language: { type: String, default: "" },
        viewport: { type: String, default: "" },
      },
      openGraph: {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        image: { type: String, default: "" },
        url: { type: String, default: "" },
        type: { type: String, default: "" },
        siteName: { type: String, default: "" },
      },
      twitter: {
        card: { type: String, default: "" },
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        image: { type: String, default: "" },
      },
      assets: {
        favicon: { type: String, default: "" },
        appleTouchIcon: { type: String, default: "" },
        manifest: { type: String, default: "" },
      },
    },
    seoScore: {
      value: { type: Number, default: 0, min: 0, max: 100 },
      grade: {
        type: String,
        enum: ["Excellent", "Good", "Needs Improvement", "Poor"],
        default: "Poor",
      },
      deductions: [
        {
          reason: String,
          points: Number,
        },
      ],
    },
    warnings: [{ type: String }],
    suggestions: [{ type: String }],
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    errorMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ url: 1 });

export default mongoose.model("Report", ReportSchema);
