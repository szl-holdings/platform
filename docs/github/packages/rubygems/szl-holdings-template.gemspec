# frozen_string_literal: true

# SZL Holdings — RubyGems Package Template (.gemspec)
# GitHub Packages Registry: https://rubygems.pkg.github.com/szl-holdings
#
# Usage: Copy this file to your Ruby gem directory, rename to your gem name,
# and update the fields below.
# See docs/github/packages/rubygems/SETUP.md for activation guide.

Gem::Specification.new do |spec|
  spec.name          = "szl-holdings-template"
  spec.version       = "0.1.0"
  spec.authors       = ["SZL Holdings"]
  spec.email         = ["engineering@szlholdings.com"]

  spec.summary       = "Template gem for SZL Holdings packages on GitHub Packages."
  spec.description   = "Replace this with a detailed description of your gem."
  spec.homepage      = "https://github.com/szl-holdings/szl-holdings-platform"
  spec.license       = "UNLICENSED"

  spec.metadata = {
    "allowed_push_host"     => "https://rubygems.pkg.github.com/szl-holdings",
    "homepage_uri"          => spec.homepage,
    "source_code_uri"       => "https://github.com/szl-holdings/szl-holdings-platform",
    "changelog_uri"         => "https://github.com/szl-holdings/szl-holdings-platform/blob/master/CHANGELOG.md",
    "documentation_uri"     => "https://github.com/szl-holdings/szl-holdings-platform/wiki",
    "bug_tracker_uri"       => "https://github.com/szl-holdings/szl-holdings-platform/issues",
    "github_repo"           => "https://github.com/szl-holdings/szl-holdings-platform",
  }

  spec.required_ruby_version = ">= 3.2.0"

  # Specify which files should be added to the gem when it is released.
  spec.files = Dir.glob("{lib,exe,sig}/**/*") + %w[README.md LICENSE CHANGELOG.md]
  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{\Aexe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  # Runtime dependencies
  # spec.add_dependency "some-gem", "~> 1.0"

  # Development dependencies
  spec.add_development_dependency "rake", "~> 13.0"
  spec.add_development_dependency "rspec", "~> 3.0"
  spec.add_development_dependency "rubocop", "~> 1.0"
end
