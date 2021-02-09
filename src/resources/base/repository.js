class Repository {
	constructor(Model) {
		this.collection = Model;
    }
    
    // @desc    Allows us to query a collection via the model inheriting this class with various options
	async find(query = {}, { multiple = true, count, page = 1, pageSize = 20, select, populate, sort = {}, lean } = {}) {
        const results = multiple ? 
            this.collection.find(query).sort(sort).limit(pageSize) : 
            this.collection.findOne(query);

        if(populate) {
            results.populate(populate);
        }

        if(select) {
            results.select(select);
        }

        if(multiple && page > 1) {
            results.skip(parseInt(page - 1) * parseInt(pageSize));
        }

		if (count) {
			return results.countDocuments().exec();
		} else if (lean) {
			return results.lean().exec();
		} else {
			return results.exec();
		}
	}

    // @desc    Allows us to count to total number of documents within this collection via the model inheriting this class
	async count() {
		return this.collection.estimatedDocumentCount();
	}

    // @desc    Allows us to create a new Mongoose document within the collection via the model inheriting this class
	async create(body) {
		const document = new this.collection(body);
		return document.save();
	}

    // @desc    Allows us to update an existing Mongoose document within the collection via the model inheriting this class
	async update(document, body = {}) {
		const id = typeof document._id !== 'undefined' ? document._id : document;
		return this.collection.findByIdAndUpdate(id, body, { new: true });
	}

    // @desc    Allows us to delete an existing Mongoose document within the collection via the model inheriting this class
	async remove(document) {
		const reloadedDocument = await this.reload(document);
		return reloadedDocument.remove();
    }
    
    // @desc    Allows us to convert identifiers to Mongoose documents, plain entities to Mongoose documents,
    //          or to simply reload Mongoose documents with different query parameters (selected fields, populated fields,
    //          or a lean version)
    async reload(document, { select, populate, lean } = {}) {
        if(!select && !populate && !lean && document instanceof this.collection) {
            return document;
        }

        return (typeof document._id !== 'undefined')
            ? this.findById(document._id, { select, populate, lean })
            : this.findById(document, { select, populate, lean });
    }
    
    // @desc    A helper function to find all documents with a given query
	async findAll({ count, select, populate, lean, sort } = {}) {
		return this.find({}, { multiple: true, count, select, populate, lean, sort });
	}

    // @desc    A helper function to find a single document by unique identifier
	async findById(id, { select, populate, lean } = {}) {
		return this.find({ _id: id }, { multiple: false, count: false, select, populate, lean });
	}

    // @desc    A helper function to find the first document returned by a given query
	async findOne(query = {}, { select, populate, lean } = {}) {
		return this.find(query, { multiple: false, count: false, select, populate, lean });
	}
}

module.exports = Repository;
