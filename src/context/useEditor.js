import React, { createContext } from "react";
import { toast } from "react-hot-toast";
import axiosInstance from "../api/base";
import Spinner from "../component/Spinner";
import Swal from "../config/Swal";

export const EditorContext = createContext();

export class EditorProvider extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      code: {},
      content: null,
      isCreateNewFileModelOpen: false,
      isCreateNewFolderModelOpen: false,
      explorer: null,
      loading:false,
      selectedFiles:[],
    };
  }

  componentDidMount(){
    const loadThemeCode = async () => {
      
      this.setState({loading:true})

      await axiosInstance
        .get("/theme/code")
        .then((response) => {
          this.setState({ code: response.data,loading:false })
        })
        .catch((error) => console.log(" Error ", error));
    };

    loadThemeCode();
  }

  onChangeState = (data) => {
    this.setState(data);
  };

  toggleCreateNewFileModel = () => {
    this.setState({
      isCreateNewFileModelOpen: !this.state.isCreateNewFileModelOpen,
    });
  };

  toggleCreateNewFolderModel = () => {
    this.setState({
      isCreateNewFolderModelOpen: !this.state.isCreateNewFolderModelOpen,
    });
  };

  onSaveFileByCTRL = async () => {
    const onSaveFileByCTRLPromise = axiosInstance.put("/theme/file/", {
      content:this.state.content,
      path: this.state.explorer.path,
    });

    toast.promise(onSaveFileByCTRLPromise,{
      loading:"Saving...",
      success:"File Saved Successfully",
      error:`Couldn't save file ${this.state.explorer?.name}`
    })

    await onSaveFileByCTRLPromise.then(async (response) => {
      await axiosInstance
        .get("/theme/file/", {
          params: {
            path: this.state.explorer?.path,
          },
        })
        .then(({ data }) => {
          Promise.resolve(
            this.setState({ code: response.data, ...data })
          )
        });
    });
  };

  onDeleteFile = async (explorer) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete ${this.state.explorer.name} file!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const onDeleteFilePromise = axiosInstance.delete("/theme/file/", {
          params: {
            path: explorer.path,
          },
        });

        toast.promise(onDeleteFilePromise, {
          loading: "Deleting...",
          success: `${explorer.name} file is deleted successfully`,
          error: `Couldn't delete file ${explorer.name}`,
        });

        await onDeleteFilePromise.then((response) => {
          const tempSelectedFiles = this.state.selectedFiles.filter((file) => file.path !== explorer.path);

          
          const tempExplorer = (explorer.name !== this.state.explorer.name) ? explorer : tempSelectedFiles.length ? tempSelectedFiles[0] : null; 

          const tempContent = (explorer.name !== this.state.explorer.name) ? this.state.content : tempSelectedFiles.length ? tempSelectedFiles[0]?.content : null;  

          this.setState({ code: response.data, explorer: tempExplorer,selectedFiles:tempSelectedFiles,content: tempContent });
        });
      } else if (
        /* Read more about handling dismissals below */
        result.dismiss === Swal.DismissReason.cancel
      ) {
        Swal.fire("Cancelled", "Your imaginary file is safe :)", "error");
      }
    });
  };

  render() {
    return (
      <EditorContext.Provider
        value={{
          ...this.state,
          onChangeState: this.onChangeState,
          toggleCreateNewFileModel: this.toggleCreateNewFileModel,
          toggleCreateNewFolderModel: this.toggleCreateNewFolderModel,
          onSaveFileByCTRL: this.onSaveFileByCTRL,
          onDeleteFile:this.onDeleteFile
        }}
      >
        {this.state.loading ? <Spinner /> : this.props.children}
      </EditorContext.Provider>
    );
  }
}
