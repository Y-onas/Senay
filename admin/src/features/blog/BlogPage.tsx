import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { contentModuleApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BlogEditor, createBlogArticle } from './BlogEditor'

export function BlogPage() {
  const [posts, setPosts] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', author: 'Senay Tela' })

  useEffect(() => {
    contentModuleApi.blog().then(setPosts).finally(() => setLoading(false))
  }, [])

  const createPost = async () => {
    setCreating(true)
    try {
      await createBlogArticle(newPost, posts, setPosts)
      setNewPost({ title: '', author: 'Senay Tela' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-burgundy">Blog</h1>
          <p className="text-brown-muted">
            One post per article — English and Amharic live in the same editor.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            placeholder="New article title"
            value={newPost.title}
            onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
            className="min-w-[220px]"
          />
          <Input
            placeholder="Author"
            value={newPost.author}
            onChange={(e) => setNewPost((prev) => ({ ...prev, author: e.target.value }))}
            className="w-40"
          />
          <Button onClick={createPost} disabled={creating}>
            <Plus className="mr-2 h-4 w-4" />
            {creating ? 'Creating…' : 'New article'}
          </Button>
        </div>
      </div>
      <BlogEditor posts={posts} onPostsChange={setPosts} hideCreate />
    </div>
  )
}
