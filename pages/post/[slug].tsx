import { GetStaticProps } from "next";
import Header from "../../components/Header";
import { sanityClient, urlFor } from "../../sanity";
import { Post } from "../../typings";
import PortableText from "react-portable-text";
import { useForm, SubmitHandler } from "react-hook-form";

interface IFormInput {
  _id: string;
  name: string;
  email: string;
  comment: string;
}

interface Props {
  post: Post;
}

function PostDetail({ post }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    await fetch("/api/createComment", {
      method: "POST",
      body: JSON.stringify(data),
    })
      .then(() => console.log(data))
      .catch((err) => console.log(err));
  };

  return (
    <main>
      <Header />
      <img
        className="w-full h-40 object-cover"
        src={urlFor(post.mainImage).url()!}
        alt=""
      />
      <article className="max-w-3xl mx-auto p-5">
        <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
        <h2 className="text-xl font-light">{post.description}</h2>
        <div>
          <img src={urlFor(post.author.image).url()!} alt="" />
          <p className="font-extralight text-sm">
            Blog post by{" "}
            <span className="text-green-600">{post.author.name}</span>
          </p>
          {/* <span>
              
              - Published at {new Date(post._createdAt).toLocaleString}
            </span> */}
        </div>
        <div>
          <PortableText
            dataset={process.env.PUBLIC_SANITY_DATASET}
            projectId={process.env.PUBLIC_SANITY_PROJECT_ID}
            content={post.body}
            serializers={{
              h1: (props: any) => {
                <h1 className="text-2xl font-bold my-5" {...props} />;
              },
              h2: (props: any) => {
                <h1 className="text-xl font-bold my-5" {...props} />;
              },
              li: ({ children }: any) => {
                <li className="ml-4 list-disc">{children}</li>;
              },
              link: ({ href, children }: any) => {
                <a href={href} className="text-blue-500">
                  {children}
                </a>;
              },
            }}
          />
        </div>
      </article>
      <hr className="max-w-lg my-5 mx-auto border border-gray-500" />
      {/* // Comment Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col p-5 max-w-2xl mx-auto mb-10"
      >
        <h3 className="text-sm text-blue-500">Enjoyed this article?</h3>
        <h4 className="text-3xl font-bold">Leave a comment below!</h4>
        <hr className="py-3 mt-2" />
        {/* ids */}
        <input {...register("_id")} type="hidden" name="_id" value={post._id} />
        {/* other inputs */}
        <label className="block mb-5" htmlFor="name">
          <span className="text-gray-700">Name</span>
          <input
            {...register("name", { required: true })}
            className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-blue-500 focus:ring"
            type="text"
            placeholder="John Appleseed"
          />
        </label>
        <label className="block mb-5" htmlFor="email">
          <span className="text-gray-700">Email</span>
          <input
            {...register("email", { required: true })}
            className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-blue-500 focus:ring"
            type="email"
            placeholder="Enter your email here"
          />
        </label>
        <label className="block mb-5" htmlFor="comment">
          <span className="text-gray-700">Comment</span>
          <textarea
            {...register("comment", { required: true })}
            className="shadow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-blue-500 focus:ring"
            rows={8}
            placeholder="Enter your comment here"
          />
        </label>
        <input
          type="submit"
          className="shadow bg-blue-500 hover:bg-blue-600 focus:shadow-outline focus:outline-none text-white font-bold rounded cursor-pointer py-3 px-4 text-green"
        />
      </form>
      {/*Errors from form validation failure*/}
      <div className="flex flex-col p-5">
        {errors.name && (
          <span className="text-red-500">A name is required</span>
        )}
        {errors.email && (
          <span className="text-red-500">Your email is required</span>
        )}
        {errors.comment && (
          <span className="text-red-500">You forgot to comment</span>
        )}
      </div>
    </main>
  );
}

export default PostDetail;

export const getStaticPaths = async () => {
  const query = `*[_type == "post"]{
        _id,
        slug {
         current,
        }
    }`;

  const posts = await sanityClient.fetch(query);

  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }));
  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type == "post" && slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author -> {
            name,
            image,
        },
        'comments': *[
            _type == "comment" && post._ref == ^._id && approved == true 
        ],
        description,
        mainImage,
        slug,
        body
    }`;

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  });

  if (!post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      post,
    },
    revalidate: 60,
  };
};
