const {curry} = require('ramda')
const Task = require('data.task')

function EmailMock(params) {
	params = params || {}
	this.renderEmailCalled = params.hasRendered || false
	this.hasSend = params.hasSend || false
	this.shouldErrorOnSend = params.shouldErrorOnSend || false
	this.template = undefined
	this.params = undefined
	this.subject = undefined
	this.to = undefined
	this.initialValues = function() {
		return { hasRendered, hasSend, shouldErrorOnSend }
	}
}

EmailMock.prototype.connect = function() {
	return Task.of(this)
}

EmailMock.prototype.renderEmail = function(template) {
	const self = this
	return function(params) {
		self.renderEmailCalled = true
		self.template = template
		self.params = params
		return Task.of('TEMPLATE_STRING')
	}
}

EmailMock.prototype.send = function() {
	const self = this
	function make(subject, to, template) {
		self.hasSend = true
		self.subject = subject
		self.to = to
		return self.shouldErrorOnSend 
			? Task.rejected('Error')
			: Task.of('Success')
	}
	const arity = make.length
	const args = Array.prototype.slice.call(arguments)
	const accumulator = function() {
		let largs = args
		if (arguments.length > 0) {
			largs = largs.concat(Array.prototype.slice.call(arguments, 0))
		}
		if (largs.length >= arity) {
			return make.apply(this, largs)
		} else {
			return curryByLength.apply(this, largs)
		}
	}
	return args.length >= arity ? accumulator() : accumulator
}

EmailMock.prototype.reset = function() {
	const values = this.initialValues
	this.renderEmailCalled = values.hasRendered
	this.hasSend = values.hasSend
	this.shouldErrorOnSend = values.shouldErrorOnSend
	this.template = undefined
	this.params = undefined
	this.subject = undefined
	this.to = undefined
}

module.exports = function(p) {
	return new EmailMock(p)
}