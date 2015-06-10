local pg = require("resty.postgres")
local serpent = require("serpent")
local json = require("cjson")
local args = ngx.req.get_uri_args()
local db = pg:new()
db:set_timeout(3000)

local ok, err = db:connect({host="104.236.20.55",port=5432, database="dev",
                            user="postgres",password="notthebees",compact=false})

if not ok then
    ngx.say(err)
end

local res, err = db:query([[SELECT
  C.course_id AS id,
  C.course_number AS number,
  C.course_abbr AS abbr,
  C.course_name AS fullname
FROM sch.course as C;
]])

db:set_keepalive(0,100)
if not res then
	ngx.say("ERROR: "..err)
	ngx.eof()
end

local crs = {}

for i,v in ipairs(res) do
	crs[v.id+1] = {
		fullname = v.fullname,
		name = v.abbr .. "-" .. v.number,
		abbr = v.abbr,
		number = v.number
	}
end

ngx.say(json.encode(crs))




