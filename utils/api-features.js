export class ApiFeatures {
  constructor(mongooseQuery, queryData) {
    this.mongooseQuery = mongooseQuery;
    this.queryData = queryData;
  }

  filter() {
    const filterObj = { ...this.queryData };
    const excludeFields = ["page", "sort", "limit", "fields", "search"];
    excludeFields.forEach((key) => delete filterObj[key]);

    let filterString = JSON.stringify(filterObj);
    filterString = filterString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.mongooseQuery.find(JSON.parse(filterString));
    return this;
  }

  sort() {
    if (this.queryData.sort) {
      const sortBy = this.queryData.sort.split(",").join(" ");
      this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery.sort("-createdAt");
    }
    return this;
  }

  search(fields = []) {
    if (this.queryData.search && fields.length > 0) {
      const searchRegex = new RegExp(this.queryData.search, "i");
      const searchQuery = {
        $or: fields.map((field) => ({ [field]: searchRegex })),
      };
      this.mongooseQuery.find(searchQuery);
    }
    return this;
  }

  paginate() {
    if (!this.queryData.page && !this.queryData.limit) {
      return this;
    }
    const page = Math.max(parseInt(this.queryData.page, 10) || 1, 1);
    const limit = Math.max(parseInt(this.queryData.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }
}
