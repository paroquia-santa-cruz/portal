require "net/http"
require "json"
require "uri"
require "fileutils"
require "date"

module LiturgiaApi
  API_BASE_URL = "https://liturgia.up.railway.app/v2/"

  CACHE_FILE = "_cache/liturgia_data.json"
  CACHE_EXPIRATION_DAYS = 1

  def self.buscar_data(dia: nil, mes: nil, ano: nil)
    data = Date.today
    dia ||= data.day
    mes ||= data.month
    ano ||= data.year

    uri = URI(API_BASE_URL)
    params = { "dia" => dia.to_s.rjust(2, '0'), "mes" => mes.to_s.rjust(2, '0'), "ano" => ano.to_s }
    uri.query = URI.encode_www_form(params)

    if cache_valido?(dia, mes, ano)
      return JSON.parse(File.read(CACHE_FILE))
    end

    response = Net::HTTP.get_response(uri)

    if response.is_a?(Net::HTTPSuccess)
      json = JSON.parse(response.body)
      if json["erro"]
        Bridgetown.logger.warn "Liturgia API", "Erro na resposta: #{json['erro']}"
        return nil
      else
        salvar_cache(json)
        return json
      end
    else
      Bridgetown.logger.error "Liturgia API", "Erro HTTP: #{response.code}"
      return nil
    end
  rescue StandardError => e
    Bridgetown.logger.error "Liturgia API", "Exceção: #{e.message}"
    return nil
  end

  private

  def self.cache_valido?(dia, mes, ano)
    return false unless File.exist?(CACHE_FILE)

    cache_time = File.mtime(CACHE_FILE)
    cache_time > (Time.now - CACHE_EXPIRATION_DAYS * 86400)
  end

  def self.salvar_cache(data)
    FileUtils.mkdir_p(File.dirname(CACHE_FILE))
    File.write(CACHE_FILE, data.to_json)
  end
end

Bridgetown::Hooks.register :site, :pre_render do |site|
  # Tenta pegar a data da querystring da página liturgia se disponível (opcional)
  site.data["liturgia_hoje"] = LiturgiaApi.buscar_data
end
