class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    const queryObject = { ...this.queryStr };
    //   excluded
    const removeFields = ["select", "page", "sort", "limit"];
    // foreach removeFields and delete
    removeFields.forEach((params) => delete queryObject[params]);

    //  create query string
    let queryStr = JSON.stringify(queryObject);

    //  create operators for filtering
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    this.query.find(JSON.parse(queryStr));
    return this;
  }

  //   query select
  select() {
    if (this.queryStr.select) {
      const fields = this.queryStr.select.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  sort() {
    // sort query
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  pagination() {
    const page = parseInt(this.queryStr.page * 1 || 1);
    const limit = parseInt(this.queryStr.limit * 1 || 100);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
