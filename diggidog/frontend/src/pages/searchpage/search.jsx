import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "./search.css";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const query = searchParams.get("q");

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    setSearchResults([]);

    try {
      const response = await fetch(
        `http://localhost:8000/api/search_users/?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="searchPage">
      <div className="searchPage__container">
        <h1 className="searchPage__title">
          Search Results {query && `for "${query}"`}
        </h1>

        {loading && <p className="searchPage__loading">Searching...</p>}

        {searchResults.length > 0 && (
          <div className="searchPage__results">
            <div className="searchPage__resultsList">
              {searchResults.map((user) => (
                <Link
                  key={user.id}
                  to={`/user/${user.id}`}
                  className="searchPage__userCardLink"
                >
                  <div className="searchPage__userCard">
                    <div className="searchPage__userInfo">
                      <h3 className="searchPage__username">@{user.username}</h3>
                      {user.name && (
                        <p className="searchPage__name">{user.name}</p>
                      )}
                      {user.bio && (
                        <p className="searchPage__bio">{user.bio}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
