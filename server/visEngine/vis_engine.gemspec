$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "vis_engine/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "vis_engine"
  s.version     = VisEngine::VERSION
  s.authors     = ["curran"]
  s.email       = ["curran.kelleher@gmail.com"]
  s.homepage    = "TODO"
  s.summary     = "TODO: Summary of VisEngine."
  s.description = "TODO: Description of VisEngine."
  s.license     = "MIT"

  s.files = Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.rdoc"]
  s.test_files = Dir["test/**/*"]

  s.add_dependency "rails", "= 3.2.18"

  s.add_development_dependency "sqlite3"
end
