import Report from "../models/Report.js";
import { normalizeAndValidateUrl } from "../utils/urlValidator.js";
import { scrapeMetadata, describeScrapeError } from "../services/scraperService.js";

/** POST /scan — validates a URL, scrapes it, persists the report. */
export const createScan = async (req, res) => {
  const { url } = req.body;
  const validation = normalizeAndValidateUrl(url);

  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.error });
  }

  try {
    const result = await scrapeMetadata(validation.url);
    const report = await Report.create(result);
    return res.status(201).json({ success: true, data: report });
  } catch (err) {
    const message = describeScrapeError(err);

    // Persist failed attempts too, so history shows the full picture.
    const failedReport = await Report.create({
      url: validation.url,
      title: validation.url,
      status: "failed",
      errorMessage: message,
    });

    return res.status(422).json({
      success: false,
      message,
      data: failedReport,
    });
  }
};

/** GET /reports — paginated, searchable, filterable list. */
export const getReports = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const { search = "", status = "all" } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { url: { $regex: search, $options: "i" } },
      { title: { $regex: search, $options: "i" } },
    ];
  }
  if (status !== "all") {
    query.status = status;
  }

  const [items, total] = await Promise.all([
    Report.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Report.countDocuments(query),
  ]);

  const successful = await Report.find({ status: "success" }).select("seoScore.value").lean();
  const avgScore = successful.length
    ? Math.round(successful.reduce((sum, r) => sum + (r.seoScore?.value || 0), 0) / successful.length)
    : 0;

  const best = await Report.findOne({ status: "success" }).sort({ "seoScore.value": -1 }).lean();

  return res.json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    stats: {
      totalScans: total,
      averageScore: avgScore,
      bestReport: best ? { url: best.url, title: best.title, score: best.seoScore?.value } : null,
    },
  });
};

/** GET /reports/:id */
export const getReportById = async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: "Report not found." });
  }
  return res.json({ success: true, data: report });
};

/** DELETE /reports/:id */
export const deleteReport = async (req, res) => {
  const report = await Report.findByIdAndDelete(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: "Report not found." });
  }
  return res.json({ success: true, message: "Report deleted." });
};
